# -------------------------
# VPC
# -------------------------
resource "aws_vpc" "aura_vpc" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "aura-glow-vpc"
  }
}

# -------------------------
# INTERNET GATEWAY
# -------------------------
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.aura_vpc.id

  tags = {
    Name = "aura-glow-igw"
  }
}

# -------------------------
# PUBLIC SUBNET (FOR NAT GATEWAY ONLY)
# -------------------------
resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.aura_vpc.id
  cidr_block              = "10.0.0.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "us-east-1a"

  tags = {
    Name = "aura-public-subnet"
  }
}

# -------------------------
# NAT EIP
# -------------------------
resource "aws_eip" "nat_eip" {
  domain = "vpc"
}

# -------------------------
# NAT GATEWAY
# -------------------------
resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public_subnet.id

  depends_on = [aws_internet_gateway.igw]
}

# -------------------------
# PRIVATE SUBNET
# -------------------------
resource "aws_subnet" "private_subnet" {
  vpc_id                  = aws_vpc.aura_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = false
  availability_zone       = "us-east-1a"

  tags = {
    Name = "aura-private-subnet"
  }
}

# -------------------------
# PUBLIC ROUTE TABLE
# -------------------------
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.aura_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "aura-public-rt"
  }
}

resource "aws_route_table_association" "public_assoc" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

# -------------------------
# PRIVATE ROUTE TABLE (USES NAT)
# -------------------------
resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.aura_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }

  tags = {
    Name = "aura-private-rt"
  }
}

resource "aws_route_table_association" "private_assoc" {
  subnet_id      = aws_subnet.private_subnet.id
  route_table_id = aws_route_table.private_rt.id
}

# -------------------------
# SECURITY GROUP
# -------------------------
resource "aws_security_group" "aura_sg" {
  name        = "aura-sg"
  description = "Private SG for EC2 (SSM only)"
  vpc_id      = aws_vpc.aura_vpc.id

  ingress {
    description = "Internal VPC traffic"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# -------------------------
# IAM ROLE FOR SSM
# -------------------------
resource "aws_iam_role" "ssm_role" {
  name = "aura-glow-ssm-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ssm_attach" {
  role       = aws_iam_role.ssm_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ssm_profile" {
  name = "aura-glow-ssm-profile"
  role = aws_iam_role.ssm_role.name
}

# -------------------------
# EC2 INSTANCE
# -------------------------
resource "aws_instance" "aura_ec2" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.micro"

  subnet_id              = aws_subnet.private_subnet.id
  vpc_security_group_ids = [aws_security_group.aura_sg.id]

  associate_public_ip_address = false

  iam_instance_profile = aws_iam_instance_profile.ssm_profile.name

  tags = {
    Name = "aura-glow-ec2"
  }
}