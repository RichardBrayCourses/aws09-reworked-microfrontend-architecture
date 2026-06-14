#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { RealtimeLikesServiceStack } from "../lib/realtimeLikesServiceStack.js";

const app = new cdk.App();

new RealtimeLikesServiceStack(app, "realtime-likes-service-stack");
