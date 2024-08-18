import { Duration, Stack, StackProps, Tags } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export class Ec2SessionStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "VPC", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      vpcName: "vpc-1",
      subnetConfiguration: [],
    });

    // 既存からとる場合
    // const vpc = ec2.Vpc.fromLookup(this,'VPC',{vpcId:'vpc-xxxxxxx'});

    const subnetPubA = new ec2.Subnet(this, "SubnetPubA", {
      vpcId: vpc.vpcId,
      cidrBlock: "10.0.0.0/24",
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

    // NAT GW
    const eipNGWA = new ec2.CfnEIP(this, "EIP_NGWA", {});
    Tags.of(eipNGWA).add("Name", "eip-ngw-a");
    const natGw = new ec2.CfnNatGateway(this, "NATGW", {
      subnetId: subnetPubA.subnetId,
      allocationId: eipNGWA.attrAllocationId,
      tags: [{ key: "Name", value: "NATGW" }],
    });

    const subnetPriA = new ec2.Subnet(this, "SubnetPriA", {
      vpcId: vpc.vpcId,
      cidrBlock: "10.0.2.0/24",
      availabilityZone: "ap-northeast-1a",
    });
    Tags.of(subnetPriA).add("Name", "subnet-pri-a");

    subnetPriA.addDefaultNatRoute(natGw.ref);

    const sgEic = new ec2.SecurityGroup(this, "SG_EIC", {
      vpc: vpc,
      description: "sg for EIC",
    });

    new ec2.CfnInstanceConnectEndpoint(this, "InstanceConnectEndpoint", {
      subnetId: subnetPriA.subnetId,
      securityGroupIds: [sgEic.securityGroupId],
      tags: [{ key: "Name", value: "ICE" }],
    });

    const sgEc2 = new ec2.SecurityGroup(this, "SG_EC2", {
      vpc: vpc,
      description: "sg for EC2",
    });
    sgEc2.addIngressRule(
      ec2.Peer.securityGroupId(sgEic.securityGroupId),
      ec2.Port.tcp(22),
      "ssh"
    );

    const ec2VpcSubnets = vpc.selectSubnets({
      subnets: [
        ec2.Subnet.fromSubnetAttributes(this, "VPC_SUBNETS", {
          subnetId: subnetPriA.subnetId,
          availabilityZone: subnetPubA.availabilityZone,
        }),
      ],
    });
    // Look up the AMI Id for the Amazon Linux 2 Image with CPU Type X86_64
    const ami = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

    new ec2.Instance(this, "EC2_INSTANCE", {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      vpc: vpc,
      vpcSubnets: ec2VpcSubnets,
      machineImage: ami,
      securityGroup: sgEc2,
      userData: undefined,
    });

    const userData = ec2.UserData.forLinux({ shebang: "#!/bin/bash" });
    // userData.addCommands(
    //   "mkdir /tmp/ec2-instance-connect",
    //   "curl https://amazon-ec2-instance-connect-us-west-2.s3.us-west-2.amazonaws.com/latest/linux_amd64/ec2-instance-connect.rhel8.rpm -o /tmp/ec2-instance-connect/ec2-instance-connect.rpm",
    //   "curl https://amazon-ec2-instance-connect-us-west-2.s3.us-west-2.amazonaws.com/latest/linux_amd64/ec2-instance-connect-selinux.noarch.rpm -o /tmp/ec2-instance-connect/ec2-instance-connect-selinux.rpm",
    //   "sudo yum install -y /tmp/ec2-instance-connect/ec2-instance-connect.rpm /tmp/ec2-instance-connect/ec2-instance-connect-selinux.rpm"
    // ); // CentOS Stream8用。yum を通すために、rpm設定を編集しないといけない
    userData.addCommands(
      "mkdir /tmp/ec2-instance-connect",
      "curl https://amazon-ec2-instance-connect-us-west-2.s3.us-west-2.amazonaws.com/latest/linux_amd64/ec2-instance-connect.rpm -o /tmp/ec2-instance-connect/ec2-instance-connect.rpm",
      "curl https://amazon-ec2-instance-connect-us-west-2.s3.us-west-2.amazonaws.com/latest/linux_amd64/ec2-instance-connect-selinux.noarch.rpm -o /tmp/ec2-instance-connect/ec2-instance-connect-selinux.rpm",
      "sudo yum install -y /tmp/ec2-instance-connect/ec2-instance-connect.rpm /tmp/ec2-instance-connect/ec2-instance-connect-selinux.rpm"
    );

    const amiCentOsStream9 = new ec2.GenericLinuxImage({
      // "ap-northeast-1": "ami-0f645e55f2fd43967", // centos 8
      "ap-northeast-1": "ami-074c801439a538a43", // centos 9
    });

    new ec2.Instance(this, "Ec2InstanceCentOs", {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc: vpc,
      vpcSubnets: ec2VpcSubnets,
      machineImage: amiCentOsStream9,
      securityGroup: sgEc2,
      userData: userData,
    });
  }
}
