import { Stack, StackProps, Tags } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { AmazonLinuxConstruct as AmazonLinuxConstruct } from "./amazon-linux-construct";
import { CentOSInstanceConstruct as CentOSConstruct } from "./centos-construct";
export class IpV6Ec2SessionStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "VPC", {
      natGateways: 0,
      maxAzs: 1,
      vpcName: "vpc-ipV6",
      subnetConfiguration: [
        // {
        //   name: "PublicSubnet",
        //   subnetType: ec2.SubnetType.PUBLIC,
        // },
        {
          name: "PrivateSubnet",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      ipProtocol: ec2.IpProtocol.DUAL_STACK,
    });

    const sgIce = new ec2.SecurityGroup(this, "SgInstanceConectEndpoint", {
      vpc: vpc,
      description: "Security Group for InstanceConnect Endpoint",
    });

    new ec2.CfnInstanceConnectEndpoint(this, "InstanceConnectEndpoint", {
      subnetId: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      }).subnetIds[0],
      securityGroupIds: [sgIce.securityGroupId],
      tags: [{ key: "Name", value: "InstanceConnectEndpoint" }],
    });

    const sgEc2 = new ec2.SecurityGroup(this, "SgEc2", {
      vpc: vpc,
      description: "Security Group for EC2",
      allowAllIpv6Outbound: true,
      allowAllOutbound: true,
    });
    sgEc2.addIngressRule(
      ec2.Peer.securityGroupId(sgIce.securityGroupId),
      ec2.Port.tcp(22),
      "ssh from InstanceConnect Endpoint"
    );

    new AmazonLinuxConstruct(this, "AmazonLinux", {
      vpc: vpc,
      subnet: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      }).subnets[0],
      securityGroup: sgEc2,
      associateEip: false,
    });

    // new CentOSConstruct(this, "CentOS", {
    //   vpc: vpc,
    //   subnet: ec2Subnet,
    //   securityGroup: sgEc2,
    //   associateEip: false,
    // });
  }
}
