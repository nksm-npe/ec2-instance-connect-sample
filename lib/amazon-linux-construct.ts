import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export interface AmazonLinuxConstructProps {
  vpc: ec2.IVpc;
  subnet: ec2.ISubnet;
  securityGroup: ec2.ISecurityGroup;
  associateEip?: boolean;
}

export class AmazonLinuxConstruct extends Construct {
  constructor(scope: Construct, id: string, props: AmazonLinuxConstructProps) {
    super(scope, id);

    const ami = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

    const instance = new ec2.Instance(this, "Instance", {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      vpc: props.vpc,
      vpcSubnets: {
        subnets: [props.subnet],
      },
      machineImage: ami,
      securityGroup: props.securityGroup,
      userData: undefined,
    });

    // EC2 Instance <> EIP
    if (props.associateEip) {
      new ec2.CfnEIPAssociation(this, "Ec2Association", {
        eip: new ec2.CfnEIP(this, "Ip").ref,
        instanceId: instance.instanceId,
      });
    }
  }
}
