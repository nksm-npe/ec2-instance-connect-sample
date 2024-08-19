import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export interface CentOSConstructProps {
  vpc: ec2.IVpc;
  subnet: ec2.ISubnet;
  securityGroup: ec2.ISecurityGroup;
}

export class CentOSInstanceConstruct extends Construct {
  constructor(scope: Construct, id: string, props: CentOSConstructProps) {
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

    const ami = new ec2.GenericLinuxImage({
      // "ap-northeast-1": "ami-0f645e55f2fd43967", // CentOS Stream 8, 利用前にMarketPlaceで購読が必要
      "ap-northeast-1": "ami-074c801439a538a43", // CentOS Stream 9,  利用前にMarketPlaceで購読が必要
    });

    new ec2.Instance(this, "Instance", {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc: props.vpc,
      vpcSubnets: ec2VpcSubnets,
      machineImage: ami,
      securityGroup: props.securityGroup,
      userData: userData,
    });
  }
}
