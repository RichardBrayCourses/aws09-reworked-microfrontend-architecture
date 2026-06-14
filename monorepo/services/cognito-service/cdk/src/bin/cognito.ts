#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CognitoStack } from "../lib/cognitoStack.js";

const app = new cdk.App();

new CognitoStack(app, "cognito-stack");
