import { Stack, StackProps, Tags } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { AmazonLinuxConstruct as AmazonLinuxConstruct } from "./amazon-linux-construct";
import { CentOSInstanceConstruct as CentOSConstruct } from "./centos-construct";
export class Ec2SessionStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const CIDR_VPC = "10.0.0.0/16";
    const CIDR_SUBNET_PUB_A = "10.0.0.0/24";
    const CIDR_SUBNET_PRI_A = "10.0.2.0/24";

    const vpc = new ec2.Vpc(this, "VPC", {
      ipAddresses: ec2.IpAddresses.cidr(CIDR_VPC),
      vpcName: "vpc-1",
      subnetConfiguration: [],
    });

    const subnetPubA = new ec2.Subnet(this, "SubnetPubA", {
      vpcId: vpc.vpcId,
      cidrBlock: CIDR_SUBNET_PUB_A,
      availabilityZone: "ap-northeast-1a",
    });
    Tags.of(subnetPubA).add("Name", "subnet-pub-a");

    const iGw = new ec2.CfnInternetGateway(this, "IGW", {
      tags: [{ key: "Name", value: "IGW" }],
    });
    const iGwAttach = new ec2.CfnVPCGatewayAttachment(this, "IGWA", {
      vpcId: vpc.vpcId,
      internetGatewayId: iGw.ref,
    });
    subnetPubA.addDefaultInternetRoute(iGw.ref, iGwAttach);

    // NAT GW (availability zone A)
    const eipNGwA = new ec2.CfnEIP(this, "EIP_NGWA", {});
    Tags.of(eipNGwA).add("Name", "eip-ngw-a");
    const natGw = new ec2.CfnNatGateway(this, "NATGW", {
      subnetId: subnetPubA.subnetId,
      allocationId: eipNGwA.attrAllocationId,
      tags: [{ key: "Name", value: "NATGW" }],
    });

    const subnetPriA = new ec2.Subnet(this, "SubnetPriA", {
      vpcId: vpc.vpcId,
      cidrBlock: CIDR_SUBNET_PRI_A,
      availabilityZone: "ap-northeast-1a",
    });
    Tags.of(subnetPriA).add("Name", "subnet-pri-a");

    subnetPriA.addDefaultNatRoute(natGw.ref);

    const sgIce = new ec2.SecurityGroup(this, "SgInstanceConectEndpoint", {
      vpc: vpc,
      description: "Security Group for InstanceConnect Endpoint",
    });

    new ec2.CfnInstanceConnectEndpoint(this, "InstanceConnectEndpoint", {
      subnetId: subnetPriA.subnetId,
      securityGroupIds: [sgIce.securityGroupId],
      tags: [{ key: "Name", value: "InstanceConnectEndpoint" }],
    });

    const sgEc2 = new ec2.SecurityGroup(this, "SgEc2", {
      vpc: vpc,
      description: "Security Group for EC2",
    });
    sgEc2.addIngressRule(
      ec2.Peer.securityGroupId(sgIce.securityGroupId),
      ec2.Port.tcp(22),
      "ssh from InstanceConnect Endpoint"
    );

    new AmazonLinuxConstruct(this, "AmazonLinux", {
      vpc: vpc,
      subnet: subnetPriA,
      securityGroup: sgEc2,
    });

    new CentOSConstruct(this, "CentOS", {
      vpc: vpc,
      subnet: subnetPriA,
      securityGroup: sgEc2,
    });
  }
}
