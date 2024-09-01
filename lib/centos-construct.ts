import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export interface CentOSConstructProps {
  vpc: ec2.IVpc;
  subnet: ec2.ISubnet;
  securityGroup: ec2.ISecurityGroup;
  associateEip?: boolean;
}

export class CentOSInstanceConstruct extends Construct {
  constructor(scope: Construct, id: string, props: CentOSConstructProps) {
    super(scope, id);

    const userData = ec2.UserData.forLinux({ shebang: "#!/bin/bash" });
    userData.addCommands(
      "mkdir /tmp/ec2-instance-connect",
      "curl https://amazon-ec2-instance-connect-us-west-2.s3.us-west-2.amazonaws.com/latest/linux_amd64/ec2-instance-connect.rpm -o /tmp/ec2-instance-connect/ec2-instance-connect.rpm",
      "curl https://amazon-ec2-instance-connect-us-west-2.s3.us-west-2.amazonaws.com/latest/linux_amd64/ec2-instance-connect-selinux.noarch.rpm -o /tmp/ec2-instance-connect/ec2-instance-connect-selinux.rpm",
      "sudo yum install -y /tmp/ec2-instance-connect/ec2-instance-connect.rpm /tmp/ec2-instance-connect/ec2-instance-connect-selinux.rpm"
    );

    const ami = new ec2.GenericLinuxImage({
      "ap-northeast-1": "ami-074c801439a538a43", // CentOS Stream 9,  利用前にMarketPlaceで購読が必要
    });

    const instance = new ec2.Instance(this, "Instance", {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc: props.vpc,
      vpcSubnets: {
        subnets: [props.subnet],
      },
      machineImage: ami,
      securityGroup: props.securityGroup,
      userData: userData,
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
