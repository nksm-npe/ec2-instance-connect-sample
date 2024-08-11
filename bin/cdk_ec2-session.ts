#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkEc2SessionStack } from '../lib/cdk_ec2-session-stack';

const app = new cdk.App();
new CdkEc2SessionStack(app, 'CdkEc2SessionStack');
