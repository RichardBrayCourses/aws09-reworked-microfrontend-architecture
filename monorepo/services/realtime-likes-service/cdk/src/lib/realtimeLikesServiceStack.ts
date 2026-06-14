import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  type StackProps,
} from "aws-cdk-lib";
import { Cors, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elasticache from "aws-cdk-lib/aws-elasticache";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import * as sources from "aws-cdk-lib/aws-lambda-event-sources";
import {
  WebSocketApi,
  WebSocketStage,
} from "aws-cdk-lib/aws-apigatewayv2";
import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export class RealtimeLikesServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const serviceRoot = join(
      __dirname,
      "..",
      "..",
      "..",
      "src",
    );

    const serviceCode = Code.fromAsset(serviceRoot);

    const vpc = new ec2.Vpc(this, "RealtimeLikesVpc", {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        { name: "Cache", subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      ],
    });
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      "RealtimeLikesLambdaSecurityGroup",
      { vpc },
    );
    const cacheSecurityGroup = new ec2.SecurityGroup(
      this,
      "RealtimeLikesCacheSecurityGroup",
      { vpc },
    );
    cacheSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(6379),
    );
    const cache = new elasticache.CfnServerlessCache(
      this,
      "RealtimeLikesCache",
      {
        engine: "valkey",
        serverlessCacheName: "realtime-likes",
        subnetIds: vpc.isolatedSubnets.map((subnet) => subnet.subnetId),
        securityGroupIds: [cacheSecurityGroup.securityGroupId],
      },
    );

    const likesEventsTopicArn = StringParameter.valueForStringParameter(
      this,
      "/photos/events/likes-topic-arn",
    );
    const likesEventsTopic = sns.Topic.fromTopicArn(
      this,
      "ImportedLikesEventsTopic",
      likesEventsTopicArn,
    );

    const realtimeLikesQueue = new sqs.Queue(this, "RealtimeLikesQueue", {
      visibilityTimeout: Duration.seconds(60),
      retentionPeriod: Duration.days(4),
      removalPolicy: RemovalPolicy.DESTROY,
    });
    likesEventsTopic.addSubscription(
      new subscriptions.SqsSubscription(realtimeLikesQueue),
    );

    const likesConsumer = new Function(this, "RealtimeLikesConsumerFunction", {
      runtime: Runtime.PYTHON_3_12,
      handler: "consumers.likes_consumer.handler",
      code: serviceCode,
      vpc,
      securityGroups: [lambdaSecurityGroup],
      timeout: Duration.seconds(30),
      environment: {
        CACHE_HOST: cache.attrEndpointAddress,
      },
    });
    likesConsumer.addEventSource(
      new sources.SqsEventSource(realtimeLikesQueue, {
        batchSize: 10,
      }),
    );
    realtimeLikesQueue.grantConsumeMessages(likesConsumer);

    // Rest API

    const restApi = new RestApi(this, "RealtimeLikesServiceGateway", {
      restApiName: "realtime-likes-service",
      cloudWatchRole: false,
      deployOptions: {
        stageName: "realtime-likes",
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: ["GET", "OPTIONS"],
        allowHeaders: ["Content-Type"],
      },
    });

    const healthFunction = new Function(this, "RealtimeLikesHealthFunction", {
      runtime: Runtime.PYTHON_3_12,
      handler: "handlers.health.handler",
      code: serviceCode,
      timeout: Duration.seconds(10),
    });
    const realtimeFunction = new Function(this, "RealtimeLikesApiFunction", {
      runtime: Runtime.PYTHON_3_12,
      handler: "handlers.realtime.handler",
      code: serviceCode,
      vpc,
      securityGroups: [lambdaSecurityGroup],
      timeout: Duration.seconds(10),
      environment: {
        CACHE_HOST: cache.attrEndpointAddress,
      },
    });

    const publicResource = restApi.root.addResource("public");
    publicResource
      .addResource("health")
      .addMethod("GET", new LambdaIntegration(healthFunction));
    publicResource
      .addResource("realtime-likes")
      .addMethod("GET", new LambdaIntegration(realtimeFunction));

    // Browser push events

    const connectionsTable = new Table(this, "RealtimeLikesConnectionsTable", {
      partitionKey: {
        name: "connectionId",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const pushStateTable = new Table(this, "RealtimeLikesPushStateTable", {
      partitionKey: {
        name: "stateKey",
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const connectFunction = new Function(
      this,
      "RealtimeLikesWebSocketConnectFunction",
      {
        runtime: Runtime.PYTHON_3_12,
        handler: "handlers.websocket_connect.handler",
        code: serviceCode,
        timeout: Duration.seconds(10),
        environment: {
          CONNECTIONS_TABLE_NAME: connectionsTable.tableName,
        },
      },
    );

    const disconnectFunction = new Function(
      this,
      "RealtimeLikesWebSocketDisconnectFunction",
      {
        runtime: Runtime.PYTHON_3_12,
        handler: "handlers.websocket_disconnect.handler",
        code: serviceCode,
        timeout: Duration.seconds(10),
        environment: {
          CONNECTIONS_TABLE_NAME: connectionsTable.tableName,
        },
      },
    );

    const webSocketApi = new WebSocketApi(this, "RealtimeLikesWebSocketApi", {
      apiName: "realtime-likes-service-push",
      connectRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          "RealtimeLikesConnectIntegration",
          connectFunction,
        ),
      },
      disconnectRouteOptions: {
        integration: new WebSocketLambdaIntegration(
          "RealtimeLikesDisconnectIntegration",
          disconnectFunction,
        ),
      },
    });

    const webSocketStage = new WebSocketStage(
      this,
      "RealtimeLikesWebSocketStage",
      {
        webSocketApi,
        stageName: "realtime-likes",
        autoDeploy: true,
      },
    );

    const pushConsumer = new Function(
      this,
      "RealtimeLikesPushConsumerFunction",
      {
        runtime: Runtime.PYTHON_3_12,
        handler: "consumers.realtime_push_consumer.handler",
        code: serviceCode,
        timeout: Duration.seconds(30),
        environment: {
          CONNECTIONS_TABLE_NAME: connectionsTable.tableName,
          PUSH_STATE_TABLE_NAME: pushStateTable.tableName,
          REALTIME_SECONDS_PER_BUCKET: "5",
          WEBSOCKET_ENDPOINT: webSocketStage.callbackUrl,
        },
      },
    );

    pushConsumer.addEventSource(new sources.SnsEventSource(likesEventsTopic));

    connectionsTable.grantReadWriteData(connectFunction);
    connectionsTable.grantReadWriteData(disconnectFunction);
    connectionsTable.grantReadWriteData(pushConsumer);
    pushStateTable.grantReadWriteData(pushConsumer);
    webSocketApi.grantManageConnections(pushConsumer);

    // Output

    new StringParameter(this, "RealtimeLikesQueueUrlParameter", {
      parameterName: "/realtime-likes/queue-url",
      stringValue: realtimeLikesQueue.queueUrl,
    });

    new StringParameter(this, "RealtimeLikesServiceBaseUrlParameter", {
      parameterName: "/services/realtime-likes-service/base-url",
      stringValue: restApi.url,
    });

    new StringParameter(this, "RealtimeLikesWebSocketUrlParameter", {
      parameterName: "/services/realtime-likes-service/websocket-url",
      stringValue: webSocketStage.url,
    });

    new CfnOutput(this, "RealtimeLikesQueueUrl", {
      value: realtimeLikesQueue.queueUrl,
    });

    new CfnOutput(this, "RealtimeLikesServiceGatewayUrl", {
      value: restApi.url,
    });

    new CfnOutput(this, "RealtimeLikesServiceWebSocketUrl", {
      value: webSocketStage.url,
    });
  }
}
