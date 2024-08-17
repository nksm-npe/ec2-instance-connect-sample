import { Duration, Stack, StackProps, Tags } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export class CdkEc2SessionStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "VPC", {
      ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
      vpcName: "vpc-1",
      subnetConfiguration: [],
    });

    // 既存からとる場合
    // const vpc = ec2.Vpc.fromLookup(this,'VPC',{vpcId:'vpc-b4933cd0'});

    // const vpcSubnets = vpc.selectSubnets({
    //   subnets: [
    //     ec2.Subnet.fromSubnetAttributes(this, 'subnet-49cba03f', {
    //       subnetId: 'subnet-49cba03f'
    //     }),
    //     ec2.Subnet.fromSubnetAttributes(this, 'subnet-5772c20f', {
    //       subnetId: 'subnet-5772c20f'
    //     }),
    //     ec2.Subnet.fromSubnetAttributes(this, 'subnet-30b8fe18', {
    //       subnetId: 'subnet-30b8fe18'
    //     }),
    //   ]
    // });

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

    const cfnInstanceConnectEndpoint = new ec2.CfnInstanceConnectEndpoint(
      this,
      "MyCfnInstanceConnectEndpoint",
      {
        subnetId: subnetPriA.subnetId,

        // the properties below are optional
        // clientToken: 'clientToken',
        // preserveClientIp: false,
        securityGroupIds: [sgEic.securityGroupId],
        // tags: [{
        //   key: 'key',
        //   value: 'value',
        // }],
      }
    );

    const sgEc2 = new ec2.SecurityGroup(this, "SG_EC2", {
      vpc: vpc,
      description: "sg for EC2",
    });
    sgEc2.addIngressRule(
      ec2.Peer.securityGroupId(sgEic.securityGroupId),
      ec2.Port.tcp(22),
      "ssh"
    );

    const vpcSubnets = vpc.selectSubnets({
      subnets: [
        ec2.Subnet.fromSubnetAttributes(this, "subnet-111", {
          subnetId: subnetPubA.subnetId,
          //  availabilityZone: 'dummy'
        }),
      ],
    });
    // Look up the AMI Id for the Amazon Linux 2 Image with CPU Type X86_64
    const ami = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

    const ec2Instance = new ec2.Instance(this, "EC2Instance", {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      vpc: vpc,
      vpcSubnets: vpcSubnets,
      machineImage: ami,
    });
  }
}
