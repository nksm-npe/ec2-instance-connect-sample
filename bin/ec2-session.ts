#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { Ec2SessionStack } from "../lib/ec2-session-stack";
import { IpV6Ec2SessionStack } from "../lib/ipv6-ec2-session-stack";

const app = new cdk.App();
new Ec2SessionStack(app, "Ec2SessionStack");
new Ec2SessionStack(app, "Ec2OnPubSessionStack", { allocateOnPublic: true });
new IpV6Ec2SessionStack(app, "IpV6Ec2SessionStack");
