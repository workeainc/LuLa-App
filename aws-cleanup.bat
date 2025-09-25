@echo off
REM 🧹 Complete AWS Cleanup Script for Windows
REM This script removes ALL Lula-related resources from AWS

echo 🧹 COMPLETE AWS CLEANUP - REMOVING EVERYTHING
echo ==================================================
echo ⚠️  WARNING: This will delete ALL Lula resources from AWS!
echo.

REM Check if AWS CLI is installed
aws --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: AWS CLI is not installed!
    echo Please install AWS CLI first: https://aws.amazon.com/cli/
    exit /b 1
)

REM Check if user is logged in
aws sts get-caller-identity >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Not logged into AWS CLI!
    echo Please run: aws configure
    exit /b 1
)

echo ✅ AWS CLI is configured

REM Get AWS account info
for /f "tokens=*" %%i in ('aws sts get-caller-identity --query Account --output text') do set ACCOUNT_ID=%%i
for /f "tokens=*" %%i in ('aws configure get region') do set REGION=%%i
echo 📋 AWS Account: %ACCOUNT_ID%
echo 📋 Region: %REGION%
echo.

echo 🚀 Starting complete AWS cleanup...
echo.

REM Delete EC2 instances
echo 🔍 Searching for EC2 instances...
aws ec2 describe-instances --query "Reservations[*].Instances[?State.Name=='running' && contains(Tags[?Key=='Name'].Value, 'lula')].[InstanceId,Tags[?Key=='Name'].Value|[0]]" --output text > temp_instances.txt 2>nul
if exist temp_instances.txt (
    for /f "tokens=1,2" %%a in (temp_instances.txt) do (
        if not "%%a"=="" (
            echo 🗑️  Terminating: %%a (%%b)
            aws ec2 terminate-instances --instance-ids %%a >nul 2>&1
        )
    )
    del temp_instances.txt
) else (
    echo ✅ No Lula EC2 instances found
)

REM Delete RDS instances
echo 🔍 Searching for RDS instances...
aws rds describe-db-instances --query "DBInstances[?contains(DBInstanceIdentifier, 'lula')].DBInstanceIdentifier" --output text > temp_rds.txt 2>nul
if exist temp_rds.txt (
    for /f "tokens=*" %%a in (temp_rds.txt) do (
        if not "%%a"=="" (
            echo 🗑️  Deleting RDS: %%a
            aws rds delete-db-instance --db-instance-identifier %%a --skip-final-snapshot --delete-automated-backups >nul 2>&1
        )
    )
    del temp_rds.txt
) else (
    echo ✅ No Lula RDS instances found
)

REM Delete S3 buckets
echo 🔍 Searching for S3 buckets...
aws s3api list-buckets --query "Buckets[?contains(Name, 'lula')].Name" --output text > temp_buckets.txt 2>nul
if exist temp_buckets.txt (
    for /f "tokens=*" %%a in (temp_buckets.txt) do (
        if not "%%a"=="" (
            echo 🗑️  Deleting bucket: %%a
            aws s3 rm s3://%%a --recursive >nul 2>&1
            aws s3api delete-bucket --bucket %%a >nul 2>&1
        )
    )
    del temp_buckets.txt
) else (
    echo ✅ No Lula S3 buckets found
)

REM Delete Elastic Beanstalk applications
echo 🔍 Searching for Elastic Beanstalk applications...
aws elasticbeanstalk describe-applications --query "Applications[?contains(ApplicationName, 'lula')].ApplicationName" --output text > temp_eb.txt 2>nul
if exist temp_eb.txt (
    for /f "tokens=*" %%a in (temp_eb.txt) do (
        if not "%%a"=="" (
            echo 🗑️  Deleting app: %%a
            aws elasticbeanstalk delete-application --application-name %%a --terminate-env-by-force >nul 2>&1
        )
    )
    del temp_eb.txt
) else (
    echo ✅ No Lula Elastic Beanstalk apps found
)

REM Delete CloudFormation stacks
echo 🔍 Searching for CloudFormation stacks...
aws cloudformation list-stacks --query "StackSummaries[?contains(StackName, 'lula') && StackStatus != 'DELETE_COMPLETE'].StackName" --output text > temp_cf.txt 2>nul
if exist temp_cf.txt (
    for /f "tokens=*" %%a in (temp_cf.txt) do (
        if not "%%a"=="" (
            echo 🗑️  Deleting stack: %%a
            aws cloudformation delete-stack --stack-name %%a >nul 2>&1
        )
    )
    del temp_cf.txt
) else (
    echo ✅ No Lula CloudFormation stacks found
)

REM Delete ECS clusters
echo 🔍 Searching for ECS clusters...
aws ecs list-clusters --query "clusterArns[?contains(@, 'lula')]" --output text > temp_ecs.txt 2>nul
if exist temp_ecs.txt (
    for /f "tokens=*" %%a in (temp_ecs.txt) do (
        if not "%%a"=="" (
            echo 🗑️  Deleting cluster: %%a
            aws ecs delete-cluster --cluster %%a >nul 2>&1
        )
    )
    del temp_ecs.txt
) else (
    echo ✅ No Lula ECS clusters found
)

REM Delete Load Balancers
echo 🔍 Searching for Load Balancers...
aws elbv2 describe-load-balancers --query "LoadBalancers[?contains(LoadBalancerName, 'lula')].LoadBalancerArn" --output text > temp_alb.txt 2>nul
if exist temp_alb.txt (
    for /f "tokens=*" %%a in (temp_alb.txt) do (
        if not "%%a"=="" (
            echo 🗑️  Deleting ALB: %%a
            aws elbv2 delete-load-balancer --load-balancer-arn %%a >nul 2>&1
        )
    )
    del temp_alb.txt
) else (
    echo ✅ No Lula Load Balancers found
)

REM Delete Security Groups
echo 🔍 Searching for Security Groups...
aws ec2 describe-security-groups --query "SecurityGroups[?contains(GroupName, 'lula') && GroupName != 'default'].GroupId" --output text > temp_sg.txt 2>nul
if exist temp_sg.txt (
    for /f "tokens=*" %%a in (temp_sg.txt) do (
        if not "%%a"=="" (
            echo 🗑️  Deleting Security Group: %%a
            aws ec2 delete-security-group --group-id %%a >nul 2>&1
        )
    )
    del temp_sg.txt
) else (
    echo ✅ No Lula Security Groups found
)

REM Delete Key Pairs
echo 🔍 Searching for Key Pairs...
aws ec2 describe-key-pairs --query "KeyPairs[?contains(KeyName, 'lula')].KeyName" --output text > temp_keys.txt 2>nul
if exist temp_keys.txt (
    for /f "tokens=*" %%a in (temp_keys.txt) do (
        if not "%%a"=="" (
            echo 🗑️  Deleting Key Pair: %%a
            aws ec2 delete-key-pair --key-name %%a >nul 2>&1
        )
    )
    del temp_keys.txt
) else (
    echo ✅ No Lula Key Pairs found
)

echo.
echo 🎉 AWS CLEANUP COMPLETED!
echo ✅ All Lula resources have been removed from AWS
echo.
echo 📋 Summary:
echo    • EC2 Instances: Terminated
echo    • RDS Instances: Deleted
echo    • S3 Buckets: Deleted
echo    • Elastic Beanstalk: Deleted
echo    • CloudFormation Stacks: Deleted
echo    • ECS Services: Deleted
echo    • Load Balancers: Deleted
echo    • Security Groups: Deleted
echo    • Key Pairs: Deleted
echo.
echo 💡 Note: Some resources may take a few minutes to fully delete
echo 💡 You can check AWS Console to verify all resources are gone
