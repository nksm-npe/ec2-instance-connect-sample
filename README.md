# EC2 Instance Connect Session Stack Samples

These stacks struct simple VPC network, EC2 instance, and EC2 Instance Connect Endpoint which enables EC2 session without bastion server.

This code contains following 3 Stacks;

- `Ec2SessionStack` : IpV4 Public, Private Subnet, NAT GW whitch attached Elastic IP , and EC2 Instance is settled on Private Subnet.
- `Ec2OnPubSessionStack` : IpV4 , EC2 instance settled on public, Elastic IP attached.
- `IpV6Ec2SessionStack` : IpV6 version. There are no EIPs or NAT GWs in this stack.

## Commands

### Deploy stack

```bash
cdk deploy <StackName>
```

For example, if you want to deploy `Ec2SessionStack`;

```bash
cdk deploy Ec2SessionStack
```

### Destroy stack

```bash
cdk destroy <StackName>
```

For example, if you want to destroy `Ec2SessionStack`;

```bash
cdk destroy Ec2SessionStack
```

## Network diagrams

### Ec2SessionStack

![](docs/diagrams/ipv4.drawio.svg)

### Ec2OnPubSessionStack

![](docs/diagrams/ipv4_pub.drawio.svg)

### IpV6Ec2SessionStack

![](docs/diagrams/ipv6.drawio.svg)
