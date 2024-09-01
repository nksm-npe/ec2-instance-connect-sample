# EC2 Instance Connect Session Stack Samples

These stacks deploys Simple VPC Network structure and EC2 Instance Connect Endpoint which enables EC2 session without bastion server.

This code contains following 3 Stacks;

- `Ec2SessionStack` : IpV4 Public, Private Subnet, NAT GW whitch attached Elastic IP , and EC2 Instance is settled on Private Subnet.
- `Ec2OnPubSessionStack` : IpV4 , EC2 instance settled on public, Elastic IP attached.
- `IpV6Ec2SessionStack` : IpV6 version. There are no EIPs or NAT GWs in this stack.

## Commands

### deploy stack

```bash
cdk deploy <StackName>
```

e.g.

```bash
cdk deploy Ec2SessionStack
```

### delete stack

```bash
cdk destroy <StackName>
```

e.g.

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
