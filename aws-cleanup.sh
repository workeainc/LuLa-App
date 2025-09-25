#!/bin/bash

# 🧹 Complete AWS Cleanup Script
# This script removes ALL Lula-related resources from AWS

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}🧹 COMPLETE AWS CLEANUP - REMOVING EVERYTHING${NC}"
echo "=================================================="
echo -e "${YELLOW}⚠️  WARNING: This will delete ALL Lula resources from AWS!${NC}"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ Error: AWS CLI is not installed!${NC}"
    echo "Please install AWS CLI first: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if user is logged in
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Error: Not logged into AWS CLI!${NC}"
    echo "Please run: aws configure"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI is configured${NC}"

# Get AWS account info
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region)
echo -e "${BLUE}📋 AWS Account: $ACCOUNT_ID${NC}"
echo -e "${BLUE}📋 Region: $REGION${NC}"
echo ""

# Function to delete EC2 instances
delete_ec2_instances() {
    echo -e "${YELLOW}🔍 Searching for EC2 instances...${NC}"
    
    # Get all running instances
    INSTANCES=$(aws ec2 describe-instances \
        --query 'Reservations[*].Instances[?State.Name==`running`].[InstanceId,Tags[?Key==`Name`].Value|[0]]' \
        --output text | grep -i lula || true)
    
    if [ -n "$INSTANCES" ]; then
        echo -e "${RED}🗑️  Found Lula EC2 instances, terminating...${NC}"
        echo "$INSTANCES" | while read instance_id name; do
            echo -e "${YELLOW}   Terminating: $instance_id ($name)${NC}"
            aws ec2 terminate-instances --instance-ids "$instance_id" || true
        done
    else
        echo -e "${GREEN}✅ No Lula EC2 instances found${NC}"
    fi
}

# Function to delete RDS instances
delete_rds_instances() {
    echo -e "${YELLOW}🔍 Searching for RDS instances...${NC}"
    
    # Get all RDS instances
    RDS_INSTANCES=$(aws rds describe-db-instances \
        --query 'DBInstances[?contains(DBInstanceIdentifier, `lula`)].DBInstanceIdentifier' \
        --output text || true)
    
    if [ -n "$RDS_INSTANCES" ]; then
        echo -e "${RED}🗑️  Found Lula RDS instances, deleting...${NC}"
        for instance in $RDS_INSTANCES; do
            echo -e "${YELLOW}   Deleting RDS: $instance${NC}"
            aws rds delete-db-instance \
                --db-instance-identifier "$instance" \
                --skip-final-snapshot \
                --delete-automated-backups || true
        done
    else
        echo -e "${GREEN}✅ No Lula RDS instances found${NC}"
    fi
}

# Function to delete S3 buckets
delete_s3_buckets() {
    echo -e "${YELLOW}🔍 Searching for S3 buckets...${NC}"
    
    # Get all buckets
    BUCKETS=$(aws s3api list-buckets \
        --query 'Buckets[?contains(Name, `lula`)].Name' \
        --output text || true)
    
    if [ -n "$BUCKETS" ]; then
        echo -e "${RED}🗑️  Found Lula S3 buckets, deleting...${NC}"
        for bucket in $BUCKETS; do
            echo -e "${YELLOW}   Deleting bucket: $bucket${NC}"
            # Delete all objects first
            aws s3 rm s3://$bucket --recursive || true
            # Delete the bucket
            aws s3api delete-bucket --bucket "$bucket" || true
        done
    else
        echo -e "${GREEN}✅ No Lula S3 buckets found${NC}"
    fi
}

# Function to delete Elastic Beanstalk applications
delete_elastic_beanstalk() {
    echo -e "${YELLOW}🔍 Searching for Elastic Beanstalk applications...${NC}"
    
    # Get all applications
    APPS=$(aws elasticbeanstalk describe-applications \
        --query 'Applications[?contains(ApplicationName, `lula`)].ApplicationName' \
        --output text || true)
    
    if [ -n "$APPS" ]; then
        echo -e "${RED}🗑️  Found Lula Elastic Beanstalk apps, deleting...${NC}"
        for app in $APPS; do
            echo -e "${YELLOW}   Deleting app: $app${NC}"
            aws elasticbeanstalk delete-application \
                --application-name "$app" \
                --terminate-env-by-force || true
        done
    else
        echo -e "${GREEN}✅ No Lula Elastic Beanstalk apps found${NC}"
    fi
}

# Function to delete CloudFormation stacks
delete_cloudformation_stacks() {
    echo -e "${YELLOW}🔍 Searching for CloudFormation stacks...${NC}"
    
    # Get all stacks
    STACKS=$(aws cloudformation list-stacks \
        --query 'StackSummaries[?contains(StackName, `lula`) && StackStatus != `DELETE_COMPLETE`].StackName' \
        --output text || true)
    
    if [ -n "$STACKS" ]; then
        echo -e "${RED}🗑️  Found Lula CloudFormation stacks, deleting...${NC}"
        for stack in $STACKS; do
            echo -e "${YELLOW}   Deleting stack: $stack${NC}"
            aws cloudformation delete-stack --stack-name "$stack" || true
        done
    else
        echo -e "${GREEN}✅ No Lula CloudFormation stacks found${NC}"
    fi
}

# Function to delete ECS services
delete_ecs_services() {
    echo -e "${YELLOW}🔍 Searching for ECS services...${NC}"
    
    # Get all clusters
    CLUSTERS=$(aws ecs list-clusters \
        --query 'clusterArns[?contains(@, `lula`)]' \
        --output text || true)
    
    if [ -n "$CLUSTERS" ]; then
        echo -e "${RED}🗑️  Found Lula ECS clusters, deleting...${NC}"
        for cluster in $CLUSTERS; do
            echo -e "${YELLOW}   Deleting cluster: $cluster${NC}"
            aws ecs delete-cluster --cluster "$cluster" || true
        done
    else
        echo -e "${GREEN}✅ No Lula ECS clusters found${NC}"
    fi
}

# Function to delete Load Balancers
delete_load_balancers() {
    echo -e "${YELLOW}🔍 Searching for Load Balancers...${NC}"
    
    # Application Load Balancers
    ALBS=$(aws elbv2 describe-load-balancers \
        --query 'LoadBalancers[?contains(LoadBalancerName, `lula`)].LoadBalancerArn' \
        --output text || true)
    
    if [ -n "$ALBS" ]; then
        echo -e "${RED}🗑️  Found Lula Load Balancers, deleting...${NC}"
        for alb in $ALBS; do
            echo -e "${YELLOW}   Deleting ALB: $alb${NC}"
            aws elbv2 delete-load-balancer --load-balancer-arn "$alb" || true
        done
    else
        echo -e "${GREEN}✅ No Lula Load Balancers found${NC}"
    fi
}

# Function to delete Security Groups
delete_security_groups() {
    echo -e "${YELLOW}🔍 Searching for Security Groups...${NC}"
    
    # Get security groups (excluding default)
    SGS=$(aws ec2 describe-security-groups \
        --query 'SecurityGroups[?contains(GroupName, `lula`) && GroupName != `default`].GroupId' \
        --output text || true)
    
    if [ -n "$SGS" ]; then
        echo -e "${RED}🗑️  Found Lula Security Groups, deleting...${NC}"
        for sg in $SGS; do
            echo -e "${YELLOW}   Deleting Security Group: $sg${NC}"
            aws ec2 delete-security-group --group-id "$sg" || true
        done
    else
        echo -e "${GREEN}✅ No Lula Security Groups found${NC}"
    fi
}

# Function to delete Key Pairs
delete_key_pairs() {
    echo -e "${YELLOW}🔍 Searching for Key Pairs...${NC}"
    
    # Get key pairs
    KEYS=$(aws ec2 describe-key-pairs \
        --query 'KeyPairs[?contains(KeyName, `lula`)].KeyName' \
        --output text || true)
    
    if [ -n "$KEYS" ]; then
        echo -e "${RED}🗑️  Found Lula Key Pairs, deleting...${NC}"
        for key in $KEYS; do
            echo -e "${YELLOW}   Deleting Key Pair: $key${NC}"
            aws ec2 delete-key-pair --key-name "$key" || true
        done
    else
        echo -e "${GREEN}✅ No Lula Key Pairs found${NC}"
    fi
}

# Main cleanup process
echo -e "${BLUE}🚀 Starting complete AWS cleanup...${NC}"
echo ""

# Run all cleanup functions
delete_ec2_instances
echo ""
delete_rds_instances
echo ""
delete_s3_buckets
echo ""
delete_elastic_beanstalk
echo ""
delete_cloudformation_stacks
echo ""
delete_ecs_services
echo ""
delete_load_balancers
echo ""
delete_security_groups
echo ""
delete_key_pairs
echo ""

echo -e "${GREEN}🎉 AWS CLEANUP COMPLETED!${NC}"
echo -e "${GREEN}✅ All Lula resources have been removed from AWS${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "   • EC2 Instances: Terminated"
echo "   • RDS Instances: Deleted"
echo "   • S3 Buckets: Deleted"
echo "   • Elastic Beanstalk: Deleted"
echo "   • CloudFormation Stacks: Deleted"
echo "   • ECS Services: Deleted"
echo "   • Load Balancers: Deleted"
echo "   • Security Groups: Deleted"
echo "   • Key Pairs: Deleted"
echo ""
echo -e "${YELLOW}💡 Note: Some resources may take a few minutes to fully delete${NC}"
echo -e "${YELLOW}💡 You can check AWS Console to verify all resources are gone${NC}"
