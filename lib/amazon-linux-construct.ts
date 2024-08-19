import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export interface AmazonLinuxConstructProps {
  vpc: ec2.IVpc;
  subnet: ec2.ISubnet;
  securityGroup: ec2.ISecurityGroup;
}

export class AmazonLinuxConstruct extends Construct {
  constructor(scope: Construct, id: string, props: AmazonLinuxConstructProps) {
    super(scope, id);

    const ec2VpcSubnets = props.vpc.selectSubnets({
      subnets: [
        ec2.Subnet.fromSubnetAttributes(this, "Ec2Subnets", {
          subnetId: props.subnet.subnetId,
          availabilityZone: props.subnet.availabilityZone,
          routeTableId: props.subnet.routeTable.routeTableId,
        }),
      ],
    });
    // Look up the AMI Id for the Amazon Linux 2 Image with CPU Type X86_64
    const ami = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

    new ec2.Instance(this, "AmazonLinux", {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      vpc: props.vpc,
      vpcSubnets: ec2VpcSubnets,
      machineImage: ami,
      securityGroup: props.securityGroup,
      userData: undefined,
    });
  }
}
