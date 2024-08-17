#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { Ec2SessionStack } from "../lib/ec2-session-stack";

const app = new cdk.App();
new Ec2SessionStack(app, "Ec2SessionStack");
