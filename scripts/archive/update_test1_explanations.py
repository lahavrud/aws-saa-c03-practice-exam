#!/usr/bin/env python3
"""
Update Test 1 with manually crafted detailed explanations
Each explanation analyzes why options are correct/incorrect based on AWS services and architecture
"""

import json
import os

# Detailed explanations for each question
EXPLANATIONS = {
    1: """The correct answer is: Amazon Kinesis with Amazon Simple Notification Service (Amazon SNS)

**Why this is correct:**
Amazon Kinesis Data Streams is specifically designed for real-time streaming data ingestion and processing. It can handle high-throughput IoT data streams and perform real-time analytics using Kinesis Data Analytics or Lambda functions. Once analytics are complete, Amazon SNS is the ideal service for push notifications to mobile applications. SNS supports mobile push notification services (APNS for iOS, FCM for Android) and can deliver messages directly to mobile apps without requiring the apps to poll for updates.

**Why other options are incorrect:**
- Amazon SQS with SNS: While SQS can work with SNS, SQS is a message queuing service designed for decoupling applications. It's pull-based (applications poll for messages) and adds unnecessary complexity. Kinesis is purpose-built for real-time streaming analytics, which is what's needed here. SQS doesn't provide the real-time streaming capabilities required for IoT data processing.
- Amazon Kinesis with Amazon SES: Amazon SES (Simple Email Service) is designed for sending email notifications, not push notifications to mobile applications. The requirement specifically asks for notifications to mobile apps, which requires SNS with mobile push support. SES cannot deliver push notifications to mobile devices.
- Amazon Kinesis with Amazon SQS: Similar to the first incorrect option, SQS is pull-based and not designed for push notifications. Mobile applications would need to continuously poll SQS, which is inefficient and drains battery. SNS provides true push notifications where AWS delivers messages directly to the mobile app.""",

    2: """The correct answer is: Configure a lifecycle policy to transition the objects to Amazon S3 One Zone-Infrequent Access (S3 One Zone-IA) after 30 days

**Why this is correct:**
S3 One Zone-IA stores data in a single Availability Zone, providing 99.5% availability at approximately 20% lower cost than S3 Standard-IA. Since the assets are re-creatable (can be regenerated if lost), the reduced durability of One Zone-IA is acceptable. The 30-day transition period ensures assets remain in Standard storage during the first week of high access, then transition to cheaper storage after access frequency drops. This balances cost optimization with the requirement for immediate accessibility.

**Why other options are incorrect:**
- S3 One Zone-IA after 7 days: Transitioning after 7 days is too early. The scenario states assets are accessed frequently for the first few days, and transitioning too early could impact performance or increase costs if assets are still being accessed frequently. The 30-day period ensures the high-access period has passed.
- S3 Standard-IA after 7 days: Standard-IA stores data across multiple Availability Zones (99.999999999% durability - 11 9's), which is overkill for re-creatable assets. It's also more expensive than One Zone-IA. The 7-day transition is also too early, potentially impacting performance during high-access periods.
- S3 Standard-IA after 30 days: While the timing is correct, Standard-IA is more expensive than One Zone-IA. For re-creatable assets, One Zone-IA provides the best cost optimization while maintaining immediate accessibility. Standard-IA's multi-AZ durability is unnecessary for data that can be regenerated.""",

    3: """The correct answer is: You can only use a launch template to provision capacity across multiple instance types using both On-Demand Instances and Spot Instances

**Why this is correct:**
Launch templates are the modern, recommended way to configure Auto Scaling groups. They support mixed instance types and mixed purchasing options (On-Demand and Spot Instances) through the "Mixed Instances Policy" feature. This allows you to specify multiple instance types and purchasing strategies, enabling cost optimization while maintaining performance. Launch templates also support versioning and can be updated without recreating the Auto Scaling group.

**Why other options are incorrect:**
- You can use a launch configuration or launch template: Launch configurations are legacy and do NOT support mixed instance types or Spot Instances. They only support a single instance type and On-Demand instances. This option is incorrect because it suggests launch configurations can do something they cannot.
- You can only use a launch configuration: Launch configurations cannot support mixed instance types or Spot Instances. They are limited to a single instance type and On-Demand purchasing only. This is a fundamental limitation of launch configurations.
- You can neither use a launch configuration nor a launch template: This is incorrect because launch templates DO support mixed instance types with Spot Instances through Mixed Instances Policy. This feature was specifically designed for this use case.""",

    4: """The correct answer is: Create a new launch configuration to use the correct instance type. Modify the Auto Scaling group to use this new launch configuration. Delete the old launch configuration as it is no longer needed

**Why this is correct:**
Launch configurations are immutable - they cannot be modified once created. To fix an incorrect instance type, you must create a new launch configuration with the correct instance type, then update the Auto Scaling group to use the new launch configuration. The old launch configuration can be deleted once the Auto Scaling group is updated. New instances launched by the Auto Scaling group will use the correct instance type from the new launch configuration. Existing instances will continue running with the old instance type until they are terminated and replaced.

**Why other options are incorrect:**
- No need to modify the launch configuration. Just modify the Auto Scaling group to use the correct instance type: Auto Scaling groups don't have a direct "instance type" setting - they get this from the launch configuration. You cannot change the instance type without changing the launch configuration. The Auto Scaling group references a launch configuration, which defines the instance type.
- No need to modify the launch configuration. Just modify the Auto Scaling group to use more number of existing instance types: Adding more instances of the wrong type doesn't solve the performance problem. The issue is that the instance type itself is incorrect, not the quantity. More instances of the wrong type won't improve performance for the application workflow.
- Modify the launch configuration to use the correct instance type: Launch configurations are immutable and cannot be modified. You must create a new one. This is a fundamental characteristic of launch configurations.""",

    5: """The correct answers are: Copy data from the source bucket to the destination bucket using the aws s3 sync command AND Set up Amazon S3 batch replication to copy objects across Amazon S3 buckets in another Region using S3 console and then delete the replication configuration

**Why these are correct:**
- AWS CLI `aws s3 sync`: This command efficiently copies objects between S3 buckets, including cross-region transfers. It's ideal for one-time bulk transfers and handles large datasets (like 1 petabyte) efficiently with parallel transfers and retry logic. It's a straightforward solution for one-time copies and can be run from any machine with AWS CLI access.
- S3 Batch Replication: S3 replication can copy existing objects (not just new ones) when configured with batch replication. After setting up replication and allowing it to copy existing objects, you can delete the replication configuration once the one-time copy is complete. This provides a managed, console-based solution that handles the transfer automatically.

**Why other options are incorrect:**
- Set up Amazon S3 Transfer Acceleration: S3 Transfer Acceleration optimizes transfers from clients (like on-premises) to S3 using CloudFront edge locations. It does NOT help with bucket-to-bucket transfers within AWS. For bucket-to-bucket transfers, use sync or replication. Transfer Acceleration is for client-to-S3 transfers, not S3-to-S3 transfers.
- Use AWS Snowball Edge device: Snowball is for transferring data from on-premises to AWS, not for S3 bucket-to-bucket transfers within AWS. The data is already in S3, so Snowball is not applicable. Snowball is used when you need to physically ship data, not for cloud-to-cloud transfers.
- Copy data using the S3 console: While you can copy individual objects in the console, copying 1 petabyte through the console UI is not practical. The console is designed for small-scale operations, not bulk transfers. This would require thousands of manual operations.""",

    6: """The correct answers are: Amazon CloudWatch AND Amazon Simple Notification Service (Amazon SNS)

**Why these are correct:**
- Amazon CloudWatch: CloudWatch automatically monitors EC2 instance metrics including CPU utilization. You can create CloudWatch alarms that trigger when CPU utilization breaches a threshold. CloudWatch alarms can directly publish to SNS topics, requiring no custom code. This is a native AWS service integration.
- Amazon SNS: SNS can receive messages from CloudWatch alarms and send email notifications to subscribers. This requires minimal setup - just create an SNS topic, subscribe email addresses, and configure the CloudWatch alarm to publish to the topic. No Lambda functions or custom code needed.

**Why other options are incorrect:**
- AWS Lambda: While Lambda can be used to process CloudWatch events and send emails, it requires writing custom code, which increases development effort. CloudWatch alarms with SNS provide a no-code solution. Lambda adds unnecessary complexity for simple monitoring and email notifications.
- AWS Step Functions: Step Functions orchestrate multiple AWS services but adds unnecessary complexity for simple monitoring and email notifications. CloudWatch + SNS is simpler and requires less development effort. Step Functions are for complex workflows, not simple alerting.
- Amazon SQS: SQS is a message queue service and doesn't directly send email notifications. While it could be part of a more complex solution (SQS -> Lambda -> SES), it's not needed here and adds unnecessary complexity. SQS requires a consumer to process messages.""",

    7: """The correct answer is: Use AWS Global Accelerator to provide a low latency way to distribute live sports results

**Why this is correct:**
AWS Global Accelerator uses AWS's global network infrastructure to route traffic to optimal endpoints based on health, geography, and routing policies. It provides static IP addresses that route to the nearest edge location, then to the optimal AWS endpoint. For UDP protocol traffic (which the application uses), Global Accelerator provides the lowest latency by routing through AWS's private network backbone rather than the public internet. It's specifically designed for non-HTTP traffic like UDP and TCP.

**Why other options are incorrect:**
- Use Auto Scaling group: Auto Scaling groups manage EC2 instance capacity but don't provide low-latency routing. They don't optimize network paths or provide global distribution. Auto Scaling is about instance management, not network optimization.
- Use Elastic Load Balancing (ELB): ELB distributes traffic across instances within a region but doesn't optimize for global latency. It doesn't use AWS's global network infrastructure or provide static IP addresses. ELB is regional, not global.
- Use Amazon CloudFront: CloudFront is a Content Delivery Network (CDN) optimized for HTTP/HTTPS traffic and static content caching. It's not designed for UDP protocol traffic or real-time data distribution. CloudFront caches content at edge locations, which isn't suitable for live, real-time sports results.""",

    8: """The correct answer is: Use Amazon Kinesis Data Streams to process the data streams as well as decouple the producers and consumers for the real-time data processor

**Why this is correct:**
Amazon Kinesis Data Streams is designed for real-time streaming data processing with custom applications. It allows you to build custom applications that process and analyze streaming data in real-time. Kinesis Data Streams decouples producers (data sources) from consumers (processing applications), allowing multiple consumers to process the same stream independently. It supports custom processing logic, making it ideal for specialized needs. Data is retained for 24 hours (or up to 7 days with extended retention), allowing for replay and multiple consumers.

**Why other options are incorrect:**
- Use Amazon Kinesis Data Firehose: Kinesis Data Firehose is designed for loading streaming data into destinations like S3, Redshift, or Elasticsearch. It doesn't support custom processing applications - it's a fully managed service that automatically delivers data to destinations. For custom processing and analysis, you need Kinesis Data Streams.
- Use Amazon Simple Queue Service (Amazon SQS): SQS is a message queuing service for decoupling applications, but it's not designed for real-time streaming data processing. It's pull-based (consumers poll for messages) and doesn't provide the real-time processing capabilities or data retention features of Kinesis. SQS is better for discrete messages, not continuous streams.
- Use Amazon Simple Notification Service (Amazon SNS): SNS is a pub/sub messaging service for notifications and fan-out scenarios. It doesn't support custom data processing or real-time analytics. SNS delivers messages to subscribers but doesn't provide the streaming data processing capabilities needed here.""",

    9: """The correct answer is: Use permissions boundary to control the maximum permissions employees can grant to the IAM principals

**Why this is correct:**
IAM permissions boundaries are the maximum permissions that an identity-based policy can grant to an IAM entity (user or role). When you set a permissions boundary for a user, that user can only perform actions that are allowed by both their identity-based policies AND the permissions boundary. This prevents users from granting themselves or others more permissions than intended, even if they have permission management capabilities. This is the most effective way to prevent accidental deletions while still allowing necessary permissions.

**Why other options are incorrect:**
- Remove full database access for all IAM users in the organization: This is too restrictive and would prevent legitimate work. Developers need database access to build features. The solution should prevent accidental deletions, not remove all access. This would break normal operations.
- The CTO should review the permissions for each new developer's IAM user: While this adds oversight, it's not scalable and relies on manual processes that can be error-prone. It doesn't provide a technical safeguard against accidental deletions. This is a process solution, not an architectural one.
- Only root user should have full database access in the organization: This is impractical and would severely limit productivity. Developers need database access to work. The root user should never be used for day-to-day operations. This would create operational bottlenecks.""",

    10: """The correct answer is: Use AWS CloudTrail to analyze API calls

**Why this is correct:**
AWS CloudTrail is a service that enables governance, compliance, operational auditing, and risk auditing of your AWS account. It logs all API calls made to AWS services, including who made the call, when it was made, and what resources were affected. CloudTrail can show exactly which user or role changed S3 bucket settings, when it happened, and what changes were made. This allows you to investigate the strange behavior without restricting user rights. CloudTrail logs can be analyzed using CloudWatch Logs Insights, Athena, or other analytics tools.

**Why other options are incorrect:**
- Implement an IAM policy to forbid users to change Amazon S3 bucket settings: This restricts user rights, which the question explicitly asks to avoid. The requirement is to figure out what's happening without restricting rights. This would prevent investigation by blocking the activity entirely.
- Implement a bucket policy requiring AWS Multi-Factor Authentication (AWS MFA) for all operations: This adds security but doesn't help identify who is making changes or why. It also doesn't address the investigation requirement. MFA prevents unauthorized access but doesn't provide audit trails for authorized users.
- Use Amazon S3 access logs to analyze user access using Athena: S3 access logs (server access logs) track object-level access (GET, PUT, DELETE operations on objects), but they don't track bucket-level configuration changes like bucket policies, versioning settings, or lifecycle policies. CloudTrail is needed for API-level auditing of bucket configuration changes.""",

    11: """The correct answers are: Amazon DynamoDB AND AWS Lambda

**Why these are correct:**
- Amazon DynamoDB: DynamoDB is a NoSQL database that stores data as key-value pairs, which matches the data format described (key-value pairs). It provides high availability with automatic multi-AZ replication and can handle high-throughput writes (one-minute frequency is easily manageable). DynamoDB is serverless, scales automatically, and provides 99.999% availability SLA. It's ideal for time-series data like weather metrics.
- AWS Lambda: Lambda can process the incoming weather data, transform it if needed, and write it to DynamoDB. It can be triggered by various sources (API Gateway, Kinesis, SQS, etc.) and provides serverless, event-driven processing. Lambda automatically scales to handle the incoming data frequency and integrates seamlessly with DynamoDB.

**Why other options are incorrect:**
- Amazon Redshift: Redshift is a data warehouse designed for analytical queries on large datasets, not for high-frequency writes of key-value pairs. It's optimized for complex SQL queries, not simple key-value storage. Redshift would be overkill and not optimized for this use case.
- Amazon RDS: RDS is a relational database service that requires schema definition and is optimized for relational data, not key-value pairs. While it could work, DynamoDB is better suited for key-value data and provides better scalability and availability for this use case. RDS requires more management overhead.
- Amazon ElastiCache: ElastiCache is an in-memory caching service (Redis or Memcached) designed for temporary data storage, not persistent storage. Data in ElastiCache can be lost if the cache is cleared or nodes fail. The requirement is for reliable storage with high availability, which requires persistent storage like DynamoDB.""",

    12: """The correct answer is: Use AWS Global Accelerator to distribute a portion of traffic to a particular deployment

**Why this is correct:**
AWS Global Accelerator provides static IP addresses that route traffic to optimal endpoints. It supports traffic dials (weighted routing) that allow you to distribute a specific percentage of traffic to different endpoints. This is perfect for blue-green deployments where you want to test a new deployment with a portion of users. Global Accelerator routes traffic at the network layer, avoiding DNS caching issues that affect mobile phones. Since it uses static IPs, mobile devices don't need to resolve DNS, bypassing the DNS caching problem mentioned in the scenario.

**Why other options are incorrect:**
- Use Amazon Route 53 weighted routing to spread traffic across different deployments: Route 53 uses DNS-based routing, which is subject to DNS caching on mobile devices. Mobile phones cache DNS records, so users might not see the new deployment even after DNS changes propagate. This doesn't solve the DNS caching problem mentioned in the scenario.
- Use AWS CodeDeploy deployment options to choose the right deployment: CodeDeploy manages application deployments but doesn't control traffic routing or distribution. It deploys code to instances but doesn't help with routing traffic between blue and green environments for testing. CodeDeploy is about deployment, not traffic management.
- Use Elastic Load Balancing (ELB) to distribute traffic across deployments: ELB distributes traffic within a region but doesn't provide traffic dials or weighted routing between different deployments. ELB also doesn't solve the DNS caching issue. ELB is regional and doesn't provide the global traffic management needed.""",

    13: """The correct answers are: Enable versioning on the Amazon S3 bucket AND Enable multi-factor authentication (MFA) delete on the Amazon S3 bucket

**Why these are correct:**
- Enable versioning: S3 versioning keeps multiple versions of objects, so if an object is deleted, you can restore a previous version. This provides protection against accidental deletion by allowing recovery of deleted objects. Versioning is a fundamental S3 feature for data protection and compliance.
- Enable MFA delete: MFA delete requires multi-factor authentication before objects can be permanently deleted. This adds an extra layer of protection against accidental deletions. Even if someone has delete permissions, they need MFA to permanently delete versioned objects, providing compliance-grade protection.

**Why other options are incorrect:**
- Change the configuration on Amazon S3 console so that the user needs to provide additional confirmation while deleting any Amazon S3 object: There is no such configuration option in S3. S3 doesn't have a built-in "confirmation dialog" setting. This is not a real S3 feature.
- Create an event trigger on deleting any Amazon S3 object. The event invokes an Amazon SNS notification via email to the IT manager: While this provides notification of deletions, it doesn't prevent accidental deletion or allow recovery. It's reactive, not protective. The object would still be deleted before the notification is sent.
- Establish a process to get managerial approval for deleting Amazon S3 objects: This is a process solution, not a technical safeguard. It relies on human processes that can be bypassed or forgotten. Technical controls like versioning and MFA delete are more reliable and enforceable.""",

    14: """The correct answer is: Attach the appropriate IAM role to the Amazon EC2 instance profile so that the instance can access Amazon S3 and Amazon DynamoDB

**Why this is correct:**
IAM roles are the recommended and secure way to grant permissions to EC2 instances. Roles provide temporary credentials that are automatically rotated, eliminating the need to store long-lived access keys. An instance profile is a container for an IAM role that allows EC2 instances to assume the role. This is the AWS best practice for EC2 access to AWS services. Credentials are automatically provided to the instance via the instance metadata service.

**Why other options are incorrect:**
- Save the AWS credentials (access key Id and secret access token) in a configuration file within the application code: This is a security anti-pattern. Hardcoding credentials in code is insecure because credentials can be exposed in code repositories, logs, or if the instance is compromised. Credentials don't rotate automatically and must be manually updated. This violates AWS security best practices.
- Encrypt the AWS credentials via a custom encryption library and save it in a secret directory on the Amazon EC2 instances: While encryption adds some security, this still requires storing credentials on the instance, which is not recommended. Credentials must still be decrypted and stored in memory, and the encryption key must be managed. IAM roles eliminate the need to store credentials entirely.
- Configure AWS CLI on the Amazon EC2 instances using a valid IAM user's credentials: Similar to the previous options, this requires storing IAM user credentials on the instance, which is insecure. IAM user credentials are long-lived and don't rotate automatically. Using IAM roles is the recommended approach.""",

    15: """The correct answer is: Leverage multi-AZ configuration of Amazon RDS Custom for Oracle that allows the Database Administrator (DBA) to access and customize the database environment and the underlying operating system

**Why this is correct:**
Amazon RDS Custom is specifically designed for applications that require customization of the database environment and underlying operating system. RDS Custom for Oracle allows DBAs to access and customize the database environment, install custom software, and configure the OS while still providing managed database services. Multi-AZ configuration provides high availability with automatic failover. This is the only RDS option that allows both customization and high availability.

**Why other options are incorrect:**
- Leverage cross AZ read-replica configuration of Amazon RDS for Oracle: Standard RDS for Oracle doesn't allow customization of the database environment or underlying OS. Read replicas provide read scaling but don't allow the level of customization required. Standard RDS is a managed service with limited OS and database customization.
- Deploy the Oracle database layer on multiple Amazon EC2 instances spread across two Availability Zones: While this allows full customization, it requires managing the database yourself, including backups, patching, and high availability setup. This increases operational overhead compared to RDS Custom, which provides managed services with customization capabilities.
- Leverage multi-AZ configuration of Amazon RDS for Oracle: Standard RDS for Oracle doesn't allow customization of the database environment or underlying operating system. The requirement specifically needs customization capabilities that standard RDS doesn't provide.""",

    16: """The correct answer is: Setup Amazon ElastiCache in front of Amazon RDS

**Why this is correct:**
Amazon ElastiCache (Redis or Memcached) is an in-memory caching service that sits in front of RDS to cache frequently accessed data. By caching player scores and stats in ElastiCache, read requests can be served from the cache instead of hitting the RDS database, significantly reducing database load and latency. This allows you to downsize the RDS instance (reducing costs) while maintaining performance. ElastiCache provides sub-millisecond latency for cached data, which is much faster than database queries.

**Why other options are incorrect:**
- Move to Amazon Redshift: Redshift is a data warehouse designed for analytical queries on large datasets, not for transactional read/write operations. It's not suitable for real-time game data retrieval. Redshift has higher latency and is optimized for complex analytical queries, not simple lookups.
- Switch application code to AWS Lambda for better performance: Lambda is a compute service and doesn't address the database read performance issue. The problem is database load, not compute performance. Lambda would still need to query the same RDS database, so it doesn't solve the problem.
- Setup Amazon RDS Read Replicas: While read replicas can help distribute read traffic, they don't reduce costs - you're adding more database instances, which increases costs. Read replicas also don't reduce latency as much as caching does. ElastiCache provides better performance improvement and cost reduction.""",

    17: """The correct answer is: Use Amazon GuardDuty to monitor any malicious activity on data stored in Amazon S3. Use Amazon Macie to identify any sensitive data stored on Amazon S3

**Why this is correct:**
- Amazon GuardDuty: GuardDuty is a threat detection service that continuously monitors for malicious activity and unauthorized behavior. It analyzes VPC Flow Logs, DNS logs, and CloudTrail events to detect threats. GuardDuty can identify suspicious API calls, data exfiltration attempts, and other security threats related to S3 data.
- Amazon Macie: Macie is a data security service that uses machine learning to automatically discover, classify, and protect sensitive data in S3. It can identify sensitive data like PII, credit card numbers, and other regulated information. Macie provides visibility into data access patterns and helps ensure compliance.

**Why other options are incorrect:**
- Use Amazon GuardDuty to monitor malicious activity AND identify sensitive data: GuardDuty is designed for threat detection, not data classification. It doesn't have the capability to identify sensitive data patterns. Macie is specifically designed for sensitive data discovery.
- Use Amazon Macie to monitor malicious activity AND identify sensitive data: Macie is designed for data discovery and classification, not threat detection. It doesn't monitor for malicious activity like unauthorized access attempts or data exfiltration. GuardDuty is needed for threat monitoring.
- Use Amazon Macie to monitor malicious activity. Use Amazon GuardDuty to identify sensitive data: This reverses the roles of the services. GuardDuty monitors threats, Macie identifies sensitive data. The correct pairing is GuardDuty for threats and Macie for sensitive data.""",

    18: """The correct answer is: Use VPC sharing to share one or more subnets with other AWS accounts belonging to the same parent organization from AWS Organizations

**Why this is correct:**
VPC sharing allows you to share subnets (not entire VPCs) with other AWS accounts within the same AWS Organizations structure. This enables multiple accounts to launch their own resources (EC2 instances, RDS databases, etc.) into shared, centrally-managed subnets. Each account manages its own resources and pays for its own usage, while sharing the network infrastructure. This is ideal for organizations that want centralized network management with account-level resource isolation.

**Why other options are incorrect:**
- Use VPC peering to share one or more subnets: VPC peering connects entire VPCs, not individual subnets. You cannot share subnets using VPC peering - it creates a network connection between two VPCs. VPC peering doesn't allow multiple accounts to launch resources in the same subnet.
- Use VPC peering to share a VPC: VPC peering connects VPCs but doesn't "share" them. Each VPC remains separate, and resources in one VPC cannot be launched in the other VPC's subnets. VPC peering is for network connectivity, not resource sharing.
- Use VPC sharing to share a VPC: VPC sharing works at the subnet level, not the VPC level. You share specific subnets with other accounts, not entire VPCs. This allows for more granular control and better resource isolation.""",

    19: """The correct answer is: Amazon ElastiCache for Redis/Memcached

**Why this is correct:**
Amazon ElastiCache for Redis or Memcached provides an in-memory caching solution that can cache SQL query results. Redis supports more advanced data structures and features, while Memcached is simpler and optimized for caching. Both provide high availability and can be configured for HIPAA compliance. ElastiCache can cache frequently accessed query results, dramatically improving performance for repeated queries while maintaining data security and compliance requirements.

**Why other options are incorrect:**
- Amazon DynamoDB Accelerator (DAX): DAX is specifically designed as a caching layer for DynamoDB, not for relational databases or SQL queries. It's optimized for DynamoDB's NoSQL data model and cannot cache SQL query results from other databases.
- Amazon DynamoDB: DynamoDB is a NoSQL database, not a caching solution. While it's fast, it doesn't cache SQL query results. The requirement specifically asks for caching SQL query results, which requires a caching layer, not a different database.
- Amazon DocumentDB: DocumentDB is a MongoDB-compatible document database, not a caching solution. It doesn't cache SQL query results and is designed for document storage, not query result caching.""",

    20: """The correct answer is: Leverage AWS Database Migration Service (AWS DMS) as a bridge between Amazon S3 and Amazon Kinesis Data Streams

**Why this is correct:**
AWS DMS can read data from S3 (using S3 as a source endpoint) and stream it to Kinesis Data Streams (using Kinesis as a target endpoint). DMS supports full load of existing data and ongoing change data capture (CDC) for new files. This provides a managed, efficient way to stream both existing and new S3 files to Kinesis without requiring custom code or Lambda functions. DMS handles the complexity of reading from S3 and writing to Kinesis.

**Why other options are incorrect:**
- Leverage Amazon S3 event notification to trigger an AWS Lambda function for the file create event: While this works for new files, it doesn't handle existing files in S3. S3 event notifications only trigger for new object creation events, not for existing objects. You would need a separate process to handle existing files.
- Amazon S3 bucket actions can be directly configured to write data into Amazon SNS: S3 cannot directly write to SNS. S3 can send event notifications to SNS, but these are just notifications about object creation, not the actual data. SNS also cannot directly send data to Kinesis Data Streams - you would need Lambda or another service.
- Configure Amazon EventBridge events for the bucket actions on Amazon S3: Similar to S3 event notifications, EventBridge can trigger on S3 events but only for new objects. It doesn't handle existing files, and you would still need Lambda to read the file content and write to Kinesis, adding complexity.""",

    21: """The correct answer is: Create an IAM role for the AWS Lambda function that grants access to the Amazon S3 bucket. Set the IAM role as the AWS Lambda function's execution role. Make sure that the bucket policy also grants access to the AWS Lambda function's execution role

**Why this is correct:**
For cross-account access, you need permissions on both sides: the Lambda function's execution role needs permissions to access S3, AND the S3 bucket policy must grant access to the Lambda function's role. The bucket policy in Account B must explicitly allow the role ARN from Account A. This is the standard pattern for cross-account resource access - both the resource policy (bucket policy) and the identity policy (role policy) must allow the access.

**Why other options are incorrect:**
- The Amazon S3 bucket owner should make the bucket public: Making the bucket public is a security risk and violates the principle of least privilege. Public buckets expose data to anyone on the internet. Cross-account access should use IAM roles and bucket policies, not public access.
- Create an IAM role for the AWS Lambda function... and that would give the AWS Lambda function cross-account access: This is incomplete. Just creating a role with permissions isn't enough - the bucket policy in Account B must also grant access to that role. Without the bucket policy, the Lambda function will be denied access.
- AWS Lambda cannot access resources across AWS accounts: This is incorrect. Lambda can absolutely access resources across accounts using IAM roles and resource policies. Cross-account access is a standard AWS pattern.""",

    22: """The correct answer is: Transfer the on-premises data into multiple AWS Snowball Edge Storage Optimized devices. Copy the AWS Snowball Edge data into Amazon S3 and create a lifecycle policy to transition the data into Amazon S3 Glacier

**Why this is correct:**
For 5 petabytes of data, Snowball Edge Storage Optimized devices are the most cost-effective solution. Each device can hold up to 80TB. Snowball devices are shipped to your location, you copy data to them, then AWS ships them back and imports the data into S3. After import, you can use lifecycle policies to automatically transition data to Glacier for long-term archival storage. This approach avoids expensive network transfer costs and is much faster than transferring 5PB over the internet.

**Why other options are incorrect:**
- Setup AWS Direct Connect to transfer data into Amazon S3 Glacier: Direct Connect has high setup costs and monthly fees. For a one-time migration of 5PB, the cost would be prohibitive. Direct Connect is designed for ongoing connectivity, not one-time bulk transfers. Also, you cannot directly write to Glacier - data must go to S3 first, then transition to Glacier.
- Setup AWS Site-to-Site VPN to transfer data into Amazon S3 Glacier: VPN connections have bandwidth limitations and would take an extremely long time to transfer 5PB. VPN is also not cost-effective for such large transfers. Like Direct Connect, you cannot directly write to Glacier.
- Transfer data into Snowball Edge devices and copy directly to Amazon S3 Glacier: Snowball devices import data into S3, not directly into Glacier. You must first import to S3, then use lifecycle policies or other methods to transition to Glacier. Glacier doesn't support direct imports from Snowball.""",

    23: """The correct answers are: By default, AWS Lambda functions always operate from an AWS-owned VPC... Once VPC-enabled, it will need a route through a NAT gateway... AND If you intend to reuse code... consider creating an AWS Lambda Layer... AND Since AWS Lambda functions can scale extremely quickly... deploy a CloudWatch Alarm...

**Why these are correct:**
- Lambda VPC behavior: By default, Lambda functions run in AWS-managed VPCs with internet access. When you attach a Lambda to your VPC, it loses default internet access and needs a NAT Gateway (or NAT Instance) in a public subnet to access the internet or AWS APIs. This is a critical consideration for VPC-enabled Lambdas.
- Lambda Layers: Lambda Layers allow you to package libraries, custom runtimes, or other function dependencies separately. This promotes code reuse, reduces deployment package size, and can speed up deployments. Layers are shared across functions, making them ideal for common dependencies.
- CloudWatch Alarms for scaling: Lambda can scale to thousands of concurrent executions very quickly. Monitoring ConcurrentExecutions and Invocations helps prevent runaway costs and ensures you're aware of scaling events. CloudWatch alarms provide proactive monitoring.

**Why other options are incorrect:**
- Serverless architecture and containers complement each other but you cannot package and deploy AWS Lambda functions as container images: This is incorrect. Lambda DOES support container images (up to 10GB). You can package Lambda functions as container images and deploy them. Container images are supported for Lambda.
- AWS Lambda allocates compute power in proportion to memory... AWS recommends to over provision your function time out settings: This is incorrect. AWS recommends RIGHT-SIZING timeout settings, not over-provisioning. Over-provisioning wastes money. You should set timeouts based on actual function execution time.
- The bigger your deployment package, the slower your Lambda function will cold-start. AWS suggests packaging dependencies as a separate package: While larger packages do increase cold start time, AWS recommends using Lambda Layers for dependencies, not separate packages. Layers are the recommended approach for managing dependencies.""",

    24: """The correct answers are: Use Amazon CloudFront distribution in front of the Application Load Balancer AND Use Amazon Aurora Replica

**Why these are correct:**
- Amazon CloudFront: CloudFront is a CDN that caches content at edge locations worldwide, reducing latency and offloading traffic from the origin (Application Load Balancer). During traffic spikes, CloudFront serves cached content from edge locations, reducing load on the backend infrastructure. It also provides DDoS protection and can handle sudden traffic increases.
- Amazon Aurora Replica: Aurora read replicas can handle read traffic, offloading the primary database during spikes. This improves read performance and provides additional capacity. Read replicas can be in the same or different regions, providing geographic distribution and better resilience.

**Why other options are incorrect:**
- Use AWS Global Accelerator: Global Accelerator routes traffic to optimal endpoints but doesn't cache content or reduce database load. It's designed for improving connection performance, not handling traffic spikes or database load. It doesn't address the database performance issue.
- Use AWS Direct Connect: Direct Connect provides dedicated network connectivity but doesn't help with traffic spikes or database performance. It's for network connectivity, not application resilience or performance optimization.
- Use AWS Shield: Shield provides DDoS protection but doesn't improve application performance or handle legitimate traffic spikes. It protects against attacks but doesn't optimize for high traffic volumes.""",

    25: """The correct answers are: Amazon S3 AND Amazon DynamoDB

**Why these are correct:**
Gateway endpoints are VPC endpoints that use route tables to route traffic to AWS services. Only S3 and DynamoDB support gateway endpoints. Gateway endpoints are free and don't require NAT Gateway or Internet Gateway for access. They're added as routes in your VPC route tables and automatically route traffic to the service without going over the internet.

**Why other options are incorrect:**
- Amazon Kinesis: Kinesis uses interface endpoints (PrivateLink), not gateway endpoints. Interface endpoints are ENIs in your VPC that provide private connectivity. They're different from gateway endpoints.
- Amazon Simple Queue Service (Amazon SQS): SQS uses interface endpoints (PrivateLink), not gateway endpoints. Interface endpoints require DNS resolution and are more complex than gateway endpoints.
- Amazon Simple Notification Service (Amazon SNS): SNS uses interface endpoints (PrivateLink), not gateway endpoints. Only S3 and DynamoDB support the simpler gateway endpoint model.""",

    26: """The correct answer is: Set up a read replica and modify the application to use the appropriate endpoint

**Why this is correct:**
Aurora read replicas are separate database instances that replicate data from the primary. They have their own endpoint that applications can use for read queries. By directing read traffic to the read replica endpoint, you offload read operations from the primary database, reducing I/O contention and allowing writes to perform better. The application must be modified to use the read replica endpoint for read queries while continuing to use the primary endpoint for writes.

**Why other options are incorrect:**
- Provision another Amazon Aurora database and link it to the primary database as a read replica: This wording is confusing, but the key issue is that you need to modify the application to use the read replica endpoint. Simply creating a read replica isn't enough - the application must be configured to route reads to it.
- Activate read-through caching on the Amazon Aurora database: Aurora doesn't have a "read-through caching" feature. You can use ElastiCache in front of Aurora for caching, but that's a separate service, not an Aurora feature.
- Configure the application to read from the Multi-AZ standby instance: The Multi-AZ standby instance is for high availability and automatic failover, not for read scaling. It's not accessible for read queries - it's only used during failover. Read replicas are separate instances designed for read scaling.""",

    27: """The correct answers are: The security group of the Amazon EC2 instance does not allow for traffic from the security group of the Application Load Balancer AND The route for the health check is misconfigured

**Why these are correct:**
- Security group blocking ALB traffic: The EC2 instance's security group must allow inbound traffic from the ALB's security group (or the ALB's IP addresses). If the security group only allows traffic from specific IPs or doesn't allow ALB traffic, health checks will fail even though the website works when accessed directly via IP.
- Health check route misconfigured: The ALB health check is configured with a specific path (like /health or /). If the application doesn't respond correctly to that path, or if the path is incorrect, health checks will fail. The website might work at / but fail at /health, causing the instances to be marked unhealthy.

**Why other options are incorrect:**
- The Amazon EBS volumes have been improperly mounted: EBS volume mounting issues would prevent the application from running at all. If the website works when accessed directly, the volumes are mounted correctly. This wouldn't cause selective health check failures.
- You need to attach elastic IP address (EIP) to the Amazon EC2 instances: EIPs are not required for ALB health checks. ALB routes traffic to instances using their private IP addresses. EIPs are for public internet access, not for ALB connectivity.
- Your web-app has a runtime that is not supported by the Application Load Balancer: ALB works with any HTTP/HTTPS application regardless of runtime. It operates at Layer 7 (HTTP) and doesn't care about the application runtime. This is not a valid reason for health check failures.""",

    28: """The correct answer is: The Amazon EBS volume was configured as the root volume of Amazon EC2 instance. On termination of the instance, the default behavior is to also terminate the attached root volume

**Why this is correct:**
When you launch an EC2 instance, the root EBS volume has a "Delete on Termination" attribute that defaults to true. This means when you terminate the instance, the root volume is automatically deleted. Additional EBS volumes attached to the instance have "Delete on Termination" set to false by default, so they persist. The team likely stored data on the root volume instead of a separate data volume, causing the data loss.

**Why other options are incorrect:**
- On termination of an Amazon EC2 instance, all the attached Amazon EBS volumes are always terminated: This is incorrect. Only the root volume is terminated by default. Additional volumes persist unless explicitly configured to be deleted.
- The Amazon EBS volumes were not backed up on Amazon S3 storage: Backing up to S3 is a good practice but not required for volumes to persist. The issue is the "Delete on Termination" setting, not lack of backups. Even without S3 backups, volumes can persist if configured correctly.
- The Amazon EBS volumes were not backed up on Amazon EFS file system storage: EFS is a file system service, not a backup destination. The issue is volume termination settings, not backup location.""",

    29: """The correct answer is: Use a Cluster placement group

**Why this is correct:**
Cluster placement groups place instances close together within a single Availability Zone, providing low-latency, high-bandwidth network performance. This is ideal for applications that require high network performance between instances, such as distributed data processing frameworks. Cluster placement groups provide up to 10 Gbps network performance between instances, which is the highest network performance available.

**Why other options are incorrect:**
- Use Spot Instances: Spot Instances are about cost optimization, not network performance. They don't improve network performance between instances. Network performance depends on instance type and placement group, not purchasing option.
- Optimize the Amazon EC2 kernel using EC2 User Data: Kernel optimization might provide minor improvements but won't significantly impact network performance between instances. Placement groups are the primary way to optimize inter-instance network performance.
- Use a Spread placement group: Spread placement groups place instances on distinct hardware to minimize correlated failures. They actually REDUCE network performance compared to Cluster placement groups because instances are spread across different hardware. For high network performance, Cluster placement groups are required.""",

    30: """The correct answer is: Use Amazon Aurora Global Database to enable fast local reads with low latency in each region

**Why this is correct:**
Aurora Global Database spans multiple AWS regions with a primary region and up to 5 secondary regions. Each secondary region has read replicas that provide low-latency local reads. This allows branch offices worldwide to read from local replicas while maintaining a single global database. It's cost-effective because you only pay for the primary database and replicas, and it maintains the relational database schema (MySQL-compatible) without requiring schema changes.

**Why other options are incorrect:**
- Use Amazon DynamoDB Global Tables: DynamoDB is a NoSQL database and would require migrating from the relational MySQL schema. The requirement explicitly states "without moving away from the underlying relational database schema." DynamoDB uses a different data model.
- Spin up Amazon EC2 instances in each AWS region, install MySQL databases: This requires managing databases yourself, including backups, patching, replication, and high availability. It's not cost-effective and increases operational overhead. Aurora Global Database provides managed global replication.
- Spin up a Amazon Redshift cluster in each AWS region: Redshift is a data warehouse, not suitable for transactional applications. It's designed for analytical workloads, not operational databases. It also doesn't support the same MySQL compatibility.""",

    31: """The correct answer is: A process replaces an existing object and immediately tries to read it. Amazon S3 always returns the latest version of the object

**Why this is correct:**
S3 provides strong read-after-write consistency for PUT operations. When you overwrite an object and immediately read it, S3 always returns the new version. There's no eventual consistency delay for overwrite PUTs. This is critical for high-frequency trading systems where data consistency is essential. S3 guarantees that after a successful PUT, subsequent GET requests will return the new data.

**Why other options are incorrect:**
- Until the change is fully propagated, Amazon S3 might return the previous data: This describes eventual consistency, which S3 does NOT have for overwrite PUTs. S3 has strong consistency for overwrite PUTs and DELETE operations. The "propagation delay" concept doesn't apply to overwrite PUTs.
- Until the change is fully propagated, Amazon S3 might return the new data: This is backwards - if there were a propagation delay, you'd get old data, not new data. But more importantly, there's no propagation delay for overwrite PUTs.
- Until the change is fully propagated, Amazon S3 does not return any data: S3 doesn't block reads during updates. It always returns data - either the old or new version. For overwrite PUTs, it always returns the new version immediately.""",

    32: """The correct answer is: Configure an AWS DataSync agent on the on-premises server... Transfer data over the AWS Direct Connect connection to an AWS PrivateLink interface VPC endpoint for Amazon EFS by using a private VIF...

**Why this is correct:**
AWS DataSync is designed for efficient data transfer between on-premises and AWS. It can transfer from NFS file systems to EFS. Using Direct Connect with a private VIF provides dedicated network connectivity. PrivateLink interface VPC endpoints allow private connectivity to EFS from on-premises via Direct Connect without traversing the public internet. DataSync can be scheduled to run automatically, making it operationally efficient.

**Why other options are incorrect:**
- Transfer to an AWS VPC peering endpoint for Amazon EFS: VPC peering connects VPCs, but EFS doesn't use "VPC peering endpoints." EFS uses mount targets within VPCs. You need PrivateLink interface endpoints for EFS access from on-premises via Direct Connect.
- Transfer to an Amazon S3 bucket... then Lambda to copy to EFS: This adds unnecessary complexity and an extra step. DataSync can transfer directly from NFS to EFS, eliminating the need for S3 as an intermediate storage and Lambda processing. Direct transfer is more efficient.
- Transfer to an Amazon S3 bucket by using public VIF: Public VIFs are for internet-routable traffic, not private connectivity. For secure, private transfers, you should use private VIFs. Also, transferring to S3 first adds unnecessary steps when DataSync can go directly to EFS.""",

    33: """The correct answer is: Amazon ECS with EC2 launch type is charged based on EC2 instances and EBS volumes used. Amazon ECS with Fargate launch type is charged based on vCPU and memory resources that the containerized application requests

**Why this is correct:**
ECS with EC2 launch type runs containers on EC2 instances you manage. You pay for the EC2 instances (compute) and EBS volumes (storage) you provision, regardless of how much the containers actually use. ECS with Fargate is serverless - you only pay for the vCPU and memory resources your containers request and consume. Fargate abstracts away the underlying infrastructure, so you don't pay for EC2 instances or EBS volumes directly.

**Why other options are incorrect:**
- Both are charged based on EC2 instances and EBS volumes: This only applies to EC2 launch type. Fargate doesn't use EC2 instances you manage, so this pricing model doesn't apply.
- Both are charged based on vCPU and memory resources: This only applies to Fargate. EC2 launch type charges for entire EC2 instances, not just the resources containers use.
- Both are just charged based on Elastic Container Service used per hour: There's no separate "ECS service" charge. ECS itself is free - you pay for the underlying compute resources (EC2 instances for EC2 launch type, or vCPU/memory for Fargate).""",

    34: """The correct answer is: Configure Amazon RDS to use SSL for data in transit

**Why this is correct:**
SSL/TLS encryption secures data while it's being transmitted between the EC2 instances and the RDS database. This provides end-to-end security for data in transit. RDS supports SSL connections, and you can require SSL for all connections. This is the standard way to secure database connections and meets the requirement for "end-to-end security for data-in-transit."

**Why other options are incorrect:**
- Create a new security group that blocks SSH from the selected Amazon EC2 instances into the database: Security groups control network access but don't encrypt data in transit. Blocking SSH doesn't encrypt database connections. SSH is for server access, not database connections.
- Create a new network ACL that blocks SSH from the entire Amazon EC2 subnet: Similar to security groups, NACLs control network traffic but don't encrypt it. Blocking SSH doesn't address data-in-transit encryption for database connections.
- Use IAM authentication to access the database instead of the database user's access credentials: IAM authentication provides authentication (who you are) but doesn't provide encryption for data in transit. You still need SSL/TLS to encrypt the connection. IAM authentication and SSL encryption are complementary, not alternatives.""",

    35: """The correct answers are: Use Amazon S3 Transfer Acceleration (Amazon S3TA) to enable faster file uploads AND Use multipart uploads for faster file uploads

**Why these are correct:**
- S3 Transfer Acceleration: Uses CloudFront's globally distributed edge locations to optimize the path from clients to S3. Data is routed through the nearest edge location, then over AWS's optimized network backbone to S3. This significantly improves upload speeds from distant locations (Europe and Asia) to US-based S3 buckets.
- Multipart uploads: Break large files into smaller parts that are uploaded in parallel. This improves throughput, allows resuming failed uploads, and is more efficient for large files. Multipart uploads are especially beneficial for large video files.

**Why other options are incorrect:**
- Create multiple AWS Direct Connect connections: Direct Connect requires physical installation at each location and has high setup costs. For multiple locations (Europe and Asia), this would be extremely expensive and time-consuming. Transfer Acceleration and multipart uploads are software solutions that work immediately.
- Use AWS Global Accelerator for faster file uploads: Global Accelerator optimizes traffic routing to applications, not to S3. It's designed for application endpoints, not object storage. S3 Transfer Acceleration is specifically designed for S3 uploads.
- Create multiple AWS Site-to-Site VPN connections: VPN connections have bandwidth limitations and don't optimize the network path like Transfer Acceleration does. They also require setup at each location and don't provide the same performance improvements.""",

    36: """The correct answer is: Consolidated billing has not been enabled. All the AWS accounts should fall under a single consolidated billing for the monthly fee to be charged only once

**Why this is correct:**
AWS Shield Advanced has a monthly subscription fee. When you have multiple AWS accounts, each account is charged separately unless consolidated billing is enabled through AWS Organizations. With consolidated billing, the monthly Shield Advanced fee is charged once for the organization, not per account. This is a significant cost savings when you have multiple accounts.

**Why other options are incorrect:**
- Savings Plans has not been enabled for AWS Shield Advanced: Shield Advanced doesn't support Savings Plans. Savings Plans are for compute services (EC2, Lambda, Fargate), not security services like Shield Advanced.
- AWS Shield Advanced also covers AWS Shield Standard plan: Shield Advanced includes Shield Standard features, but this doesn't cause increased costs. Shield Standard is free, and Shield Advanced replaces it, not adds to it.
- AWS Shield Advanced is being used for custom servers that are not part of AWS Cloud: Shield Advanced only protects AWS resources (CloudFront, ELB, Route 53, EC2, etc.). It cannot protect on-premises or non-AWS infrastructure. This wouldn't cause unexpected costs.""",

    37: """The correct answer is: Amazon API Gateway, Amazon Simple Queue Service (Amazon SQS) and Amazon Kinesis

**Why this is correct:**
- Amazon API Gateway: Provides request throttling through usage plans and rate limits. You can configure throttling limits (requests per second) to prevent sudden traffic spikes from overwhelming backend services.
- Amazon SQS: Acts as a buffer/queue between components. During traffic spikes, requests can be queued in SQS instead of overwhelming downstream services. SQS provides automatic scaling and can handle traffic bursts.
- Amazon Kinesis: Can buffer and throttle streaming data. Kinesis Data Streams can handle high-throughput data ingestion and throttle consumers, preventing downstream systems from being overwhelmed.

**Why other options are incorrect:**
- Amazon SQS, SNS and AWS Lambda: SNS doesn't provide throttling or buffering - it's a pub/sub messaging service. Lambda can be throttled but doesn't throttle incoming requests. This combination doesn't provide the throttling capabilities needed.
- Amazon Gateway Endpoints, SQS and Kinesis: Gateway endpoints are VPC endpoints for S3 and DynamoDB - they don't provide throttling. They're for private connectivity, not traffic management.
- Elastic Load Balancer, SQS, AWS Lambda: ELB distributes traffic but doesn't throttle it. ELB can handle high traffic but doesn't prevent spikes from reaching backend services. API Gateway provides better throttling capabilities.""",

    38: """The correct answer is: Amazon Neptune

**Why this is correct:**
Amazon Neptune is a graph database designed for applications with highly connected data. It's optimized for queries that traverse relationships, like "friends of a user" or "videos liked by friends." Graph databases excel at relationship queries that would require complex JOINs in relational databases. Neptune supports Gremlin and SPARQL query languages, making it ideal for social media use cases with complex relationship queries.

**Why other options are incorrect:**
- Amazon OpenSearch Service: OpenSearch (formerly Elasticsearch) is a search and analytics engine, not a graph database. It's good for full-text search and log analytics but not optimized for relationship traversal queries like "friends of friends."
- Amazon Aurora: Aurora is a relational database optimized for SQL queries. While it can handle complex queries with JOINs, graph databases like Neptune are specifically designed for relationship-heavy queries and perform much better for social network-style queries.
- Amazon Redshift: Redshift is a data warehouse for analytical queries on large datasets. It's not designed for transactional queries or relationship traversal. It's optimized for aggregations and analytical workloads, not graph queries.""",

    39: """The correct answer is: Use AWS Cost Explorer Resource Optimization to get a report of Amazon EC2 instances that are either idle or have low utilization and use AWS Compute Optimizer to look at instance type recommendations

**Why this is correct:**
- AWS Cost Explorer Resource Optimization: Analyzes EC2 usage patterns and identifies idle or underutilized instances that can be terminated or rightsized. It provides actionable recommendations for cost savings.
- AWS Compute Optimizer: Analyzes historical utilization metrics and recommends optimal instance types. It can suggest moving to smaller instance types or different instance families that better match workload requirements, reducing costs.

**Why other options are incorrect:**
- Use AWS Trusted Advisor checks on Amazon EC2 Reserved Instances to automatically renew reserved instances: Trusted Advisor doesn't automatically renew Reserved Instances. Also, the startup likely doesn't have Reserved Instances yet. Trusted Advisor provides recommendations but doesn't focus on idle instances or instance type optimization.
- Use AWS Compute Optimizer recommendations to help you choose optimal EC2 purchasing options: Compute Optimizer recommends instance types, not purchasing options (On-Demand vs Reserved vs Spot). For purchasing options, you'd use Cost Explorer or Reserved Instance recommendations.
- Use Amazon S3 Storage class analysis: This is for S3 cost optimization, not EC2 or RDS. The startup's infrastructure includes EC2 and RDS, so S3 optimization doesn't address their main cost concerns.""",

    40: """The correct answers are: By default, scripts entered as user data are executed with root user privileges AND By default, user data runs only during the boot cycle when you first launch an instance

**Why these are correct:**
- Root privileges: User data scripts run as root by default, allowing them to perform system-level operations like installing packages, modifying system files, and configuring services. This is necessary for many bootstrap operations.
- Runs only during first boot: User data executes once when the instance first launches, not on every restart. This is by design - user data is for initial setup, not ongoing maintenance. If you need scripts to run on every boot, you must configure that explicitly (e.g., using systemd or cron).

**Why other options are incorrect:**
- When an instance is running, you can update user data by using root user credentials: User data cannot be modified after instance launch. It's set at launch time and cannot be changed. You can view it, but not update it. To change user data, you must launch a new instance.
- By default, user data is executed every time an Amazon EC2 instance is re-started: User data runs only on first launch, not on restarts. Restarting an instance doesn't re-execute user data. This is a common misconception.
- By default, scripts entered as user data do not have root user privileges: This is incorrect. User data scripts run as root by default, which is why they can perform system-level operations.""",

    41: """The correct answer is: Amazon FSx for Lustre

**Why this is correct:**
Amazon FSx for Lustre is a high-performance file system designed for compute-intensive workloads that need fast access to data. It's optimized for parallel and distributed processing, making it ideal for EDA (Electronic Design Automation) applications. Lustre provides high throughput and low latency for both reads and writes. It can store "hot data" (frequently accessed) with high performance and can integrate with S3 for "cold data" storage, providing a cost-effective tiered storage solution.

**Why other options are incorrect:**
- AWS Glue: Glue is an ETL (Extract, Transform, Load) service for data preparation and transformation. It's not a file system and doesn't provide the high-performance file access needed for EDA applications. Glue is for data processing pipelines, not file storage.
- Amazon EMR: EMR is a managed Hadoop/Spark cluster service for big data processing. While it can handle large datasets, it's not optimized for the high-performance file access patterns of EDA applications. EMR is for distributed data processing, not file system performance.
- Amazon FSx for Windows File Server: FSx for Windows is designed for Windows-based file shares and Active Directory integration. It's not optimized for high-performance compute workloads like EDA. Lustre is specifically designed for HPC and compute-intensive applications.""",

    42: """The correct answers are: Create a Golden Amazon Machine Image (AMI) with the static installation components already setup AND Use Amazon EC2 user data to customize the dynamic installation parts at boot time

**Why these are correct:**
- Golden AMI: A Golden AMI is a pre-configured AMI with common components already installed. By including static installation components (like operating system, common libraries, frameworks) in the AMI, you eliminate the need to install them on every instance launch, dramatically reducing launch time.
- User data for dynamic parts: User data scripts can handle dynamic, instance-specific configuration that needs to happen at boot time. This allows customization while leveraging the pre-configured AMI for static components. The combination reduces launch time from 45 minutes to under 2 minutes.

**Why other options are incorrect:**
- Store the installation files in Amazon S3 so they can be quickly retrieved: While S3 provides fast retrieval, you still need to download and install the files, which takes time. This doesn't solve the 45-minute installation problem. Pre-installing in an AMI is much faster.
- Use Amazon EC2 user data to install the application at boot time: Installing everything via user data still takes 45 minutes. The solution is to pre-install static components in an AMI, not install everything at boot time.
- Use AWS Elastic Beanstalk deployment caching feature: Elastic Beanstalk doesn't have a "deployment caching" feature that would significantly reduce installation time. The solution requires AMI optimization and user data, not Beanstalk features.""",

    43: """The correct answer is: Use Amazon S3 Bucket Policies

**Why this is correct:**
S3 Bucket Policies are resource-based policies attached to S3 buckets that can grant permissions to IAM users, roles, and even other AWS accounts. Bucket policies can control both user-level access (within the same account) and account-level access (cross-account). They're the most flexible and optimized way to control S3 access, supporting complex permission scenarios including cross-account access, which is mentioned in the requirement.

**Why other options are incorrect:**
- Use Identity and Access Management (IAM) policies: IAM policies are identity-based and attached to users, groups, or roles. While they can grant S3 access, they don't provide account-level control for cross-account scenarios. Bucket policies are needed for cross-account access control.
- Use Security Groups: Security Groups are for EC2 instances and other VPC resources, not for S3 access control. S3 is accessed via API calls, not network-level security. Security Groups don't apply to S3.
- Use Access Control Lists (ACLs): ACLs are legacy and less flexible than bucket policies. They don't support complex permission scenarios or cross-account access as effectively as bucket policies. Bucket policies are the recommended approach.""",

    44: """The correct answer is: Use VPC endpoint to access Amazon SQS

**Why this is correct:**
VPC endpoints (specifically interface endpoints for SQS) provide private connectivity between your VPC and AWS services without traversing the public internet. This keeps traffic within AWS's network, improving security and potentially reducing costs. Interface endpoints use PrivateLink technology and provide secure, private access to SQS from VPC-bound components.

**Why other options are incorrect:**
- Use Internet Gateway to access Amazon SQS: Internet Gateways provide public internet access for resources in public subnets. Using an Internet Gateway would route SQS traffic over the public internet, which is what the team wants to avoid. It also requires public subnets and public IPs.
- Use VPN connection to access Amazon SQS: VPN connections are for connecting on-premises networks to VPCs, not for accessing AWS services from within a VPC. VPN doesn't provide private connectivity to AWS services - traffic would still go over the internet.
- Use Network Address Translation (NAT) instance to access Amazon SQS: NAT instances allow private subnet resources to access the internet, but traffic still goes over the public internet. VPC endpoints provide true private connectivity without internet traversal.""",

    45: """The correct answer is: Deploy the visualization tool in the same AWS region as the data warehouse. Access the visualization tool over a Direct Connect connection at a location in the same region

**Why this is correct:**
Data transfer within the same AWS region is free for data transfer between AWS services. By deploying the visualization tool in the same region as the data warehouse, the 60MB query responses don't incur data transfer costs. Users accessing the visualization tool over Direct Connect only transfer the 600KB web pages, not the 60MB query results. Direct Connect has lower egress costs than internet transfer, and since query results stay within AWS (same region), there's no egress charge for them.

**Why other options are incorrect:**
- Deploy the visualization tool on-premises. Query the data warehouse directly over Direct Connect: This would transfer 60MB query results over Direct Connect for each query, which incurs data transfer costs. The visualization tool in AWS with same-region queries avoids this cost.
- Deploy the visualization tool on-premises. Query over the internet: Internet egress from AWS has higher costs than Direct Connect. Transferring 60MB query results over the internet would be more expensive.
- Deploy in AWS same region. Access over the internet: While query results stay in-region (free), accessing the tool over the internet has higher costs than Direct Connect for the web page transfers.""",

    46: """The correct answers are: Make sure that the throughput for the target FIFO queue does not exceed 3,000 messages per second AND Make sure that the name of the FIFO queue ends with the .fifo suffix AND Delete the existing standard queue and recreate it as a FIFO queue

**Why these are correct:**
- Throughput limit of 3,000 messages per second: FIFO queues have a throughput limit of 3,000 messages per second (or 300 messages per second without batching). With batching, you can achieve up to 3,000 messages per second. This is a hard limit that must be considered during migration.
- Queue name must end with .fifo: FIFO queues require the .fifo suffix in their name. This is a mandatory naming convention that distinguishes FIFO queues from standard queues.
- Delete and recreate: Standard queues cannot be converted to FIFO queues. You must delete the standard queue and create a new FIFO queue. This is because FIFO and standard queues have fundamentally different architectures and behaviors.

**Why other options are incorrect:**
- Make sure that the name of the FIFO queue is the same as the standard queue: FIFO queues must have different names (with .fifo suffix). You cannot reuse the same name. Also, you need to delete the standard queue first.
- Make sure that the throughput does not exceed 300 messages per second: This is the limit WITHOUT batching. With batching (which the question mentions), the limit is 3,000 messages per second.
- Convert the existing standard queue into a FIFO queue: Standard queues cannot be converted to FIFO queues. They must be deleted and recreated. This is a fundamental limitation.""",

    47: """The correct answer is: Use AWS Database Migration Service (AWS DMS) to replicate the data from the databases into Amazon Redshift

**Why this is correct:**
AWS DMS is a managed service designed specifically for database migration and replication. It can continuously replicate data from multiple source databases (Oracle, PostgreSQL) to Redshift with minimal configuration. DMS handles schema conversion, data transformation, and ongoing replication automatically. It requires no infrastructure management and minimal development effort - you configure source and target endpoints and DMS handles the rest.

**Why other options are incorrect:**
- Use Amazon Kinesis Data Streams to replicate data: Kinesis is for real-time streaming data, not database replication. It would require custom code to read from databases and write to Redshift. Kinesis doesn't understand database schemas or handle replication automatically.
- Use AWS Glue to replicate the data: Glue is an ETL service for data transformation and preparation, not continuous replication. It's designed for batch ETL jobs, not ongoing database replication. Glue would require more development and management effort.
- Use AWS EMR to replicate the data: EMR is for big data processing with Hadoop/Spark, not database replication. It would require significant development effort to build replication logic. EMR is overkill for database replication and requires infrastructure management.""",

    48: """The correct answer is: Create a virtual private gateway (VGW) on the AWS side of the VPN and a Customer Gateway on the on-premises side of the VPN

**Why this is correct:**
For AWS Managed IPSec VPN connections, the Virtual Private Gateway (VGW) is an AWS-managed VPN endpoint that's attached to your VPC. The Customer Gateway is a resource in AWS that represents your on-premises VPN device. The VGW goes on the AWS side, and the Customer Gateway represents the on-premises side. This is the standard AWS VPN architecture.

**Why other options are incorrect:**
- Create a VGW on the on-premises side and a Customer Gateway on the AWS side: This reverses the components. VGW is AWS-managed and goes on the AWS side. Customer Gateway represents on-premises equipment.
- Create a Customer Gateway on both sides: Customer Gateways represent on-premises equipment. You only need one Customer Gateway (in AWS) to represent your on-premises device. The AWS side uses a VGW.
- Create a VGW on both sides: VGWs are AWS-managed and only exist on the AWS side. On-premises uses your own VPN equipment, represented by a Customer Gateway resource in AWS.""",

    49: """The correct answer is: Leverage AWS Config managed rule to check if any third-party SSL/TLS certificates imported into ACM are marked for expiration within 30 days. Configure the rule to trigger an Amazon SNS notification

**Why this is correct:**
AWS Config has managed rules that can check certificate expiration. The key detail is that the certificates are "imported into ACM" (third-party certificates), not created by ACM. AWS Config can monitor imported certificates and trigger SNS notifications when they're about to expire. This requires minimal scripting - just configure the Config rule and SNS topic.

**Why other options are incorrect:**
- Monitor CloudWatch metric for certificates created via ACM: ACM-created certificates are automatically renewed by AWS, so monitoring expiration isn't necessary. Also, CloudWatch doesn't have a standard metric for certificate expiration. The question specifies "third-party" certificates imported into ACM.
- Leverage AWS Config managed rule for certificates created via ACM: ACM-created certificates are automatically managed by AWS and don't need expiration monitoring. The requirement is for imported third-party certificates.
- Monitor CloudWatch metric for certificates imported into ACM: CloudWatch doesn't provide a standard metric for certificate expiration. AWS Config is the service designed for compliance and configuration monitoring, including certificate expiration.""",

    50: """The correct answer is: VPC Flow Logs, Domain Name System (DNS) logs, AWS CloudTrail events

**Why this is correct:**
Amazon GuardDuty analyzes these specific data sources to detect threats:
- VPC Flow Logs: Network traffic information showing source, destination, ports, and protocols. GuardDuty analyzes this for suspicious network activity.
- DNS logs: DNS query logs from Route 53 Resolver. GuardDuty analyzes DNS queries for malicious domains, data exfiltration attempts, and other threats.
- CloudTrail events: API calls and management events. GuardDuty analyzes API calls for unauthorized access, privilege escalation, and other security threats.

**Why other options are incorrect:**
- VPC Flow Logs, API Gateway logs, S3 access logs: GuardDuty doesn't analyze API Gateway logs or S3 access logs. It uses CloudTrail (which includes API calls) and DNS logs, not application-level logs.
- ELB logs, DNS logs, CloudTrail events: GuardDuty doesn't analyze ELB access logs. It uses VPC Flow Logs for network traffic analysis, not ELB logs.
- CloudFront logs, API Gateway logs, CloudTrail events: GuardDuty doesn't analyze CloudFront or API Gateway logs. It focuses on VPC Flow Logs, DNS logs, and CloudTrail events.""",

    51: """The correct answer is: Use Amazon Cognito User Pools

**Why this is correct:**
Amazon Cognito User Pools provides built-in user management with features like user registration, authentication, password management, and user profiles. It integrates directly with API Gateway for authorization. User Pools handle user lifecycle management (sign up, sign in, password reset) without requiring you to build these features yourself. This is exactly what's needed when you want "built-in user management."

**Why other options are incorrect:**
- Use AWS_IAM authorization: IAM authorization uses AWS IAM credentials, which are for AWS services and applications, not end users. IAM doesn't provide user management features like registration, password reset, or user profiles. It's for service-to-service authentication.
- Use Amazon Cognito Identity Pools: Identity Pools provide temporary AWS credentials for users, but they don't provide user management. Identity Pools work with User Pools or other identity providers. They're for granting AWS resource access, not user management.
- Use AWS Lambda authorizer: Lambda authorizers allow custom authorization logic, but they don't provide user management. You'd need to build user registration, authentication, and management features yourself, which contradicts the "built-in user management" requirement.""",

    52: """The correct answer is: Use Amazon EC2 dedicated hosts

**Why this is correct:**
Dedicated Hosts are physical servers dedicated to your use. They allow you to use your existing server-bound software licenses (like Windows Server, SQL Server, etc.) because you have visibility and control over the underlying physical server. Dedicated Hosts are the most cost-effective way to use existing licenses on AWS while maintaining compliance with license terms that require physical server dedication.

**Why other options are incorrect:**
- Use Amazon EC2 dedicated instances: Dedicated instances run on dedicated hardware but you don't have visibility into the physical server. Many license agreements require visibility into the physical server, which Dedicated Hosts provide but Dedicated Instances don't.
- Use Amazon EC2 on-demand instances: On-demand instances don't provide the physical server visibility needed for server-bound licenses. They're shared or dedicated at the instance level, not the host level.
- Use Amazon EC2 reserved instances: Reserved instances are a purchasing option, not an instance type. They don't address the license requirement for physical server visibility. Reserved instances can be On-Demand, Dedicated Instances, or Dedicated Hosts.""",

    53: """The correct answers are: NAT instance can be used as a bastion server AND NAT instance supports port forwarding AND Security Groups can be associated with a NAT instance

**Why these are correct:**
- NAT instance as bastion: NAT instances are EC2 instances, so they can be used as bastion servers for SSH access to private subnet instances. You can SSH into the NAT instance, then SSH from there to private instances.
- NAT instance supports port forwarding: NAT instances run software (like iptables) that can be configured for port forwarding. This allows you to forward specific ports to instances in private subnets.
- Security Groups on NAT instance: NAT instances are EC2 instances, so they support security groups for fine-grained network access control.

**Why other options are incorrect:**
- NAT gateway can be used as a bastion server: NAT gateways are managed AWS services, not EC2 instances. You cannot SSH into them or use them as bastion servers. They're only for NAT functionality.
- NAT gateway supports port forwarding: NAT gateways don't support port forwarding. They only provide basic NAT functionality (source/destination NAT). Port forwarding requires instance-level configuration.
- Security Groups can be associated with a NAT gateway: NAT gateways are managed services and don't support security groups. They use NACLs for network-level control, not security groups.""",

    54: """The correct answer is: Create a new IAM role with the required permissions to access the resources in the production environment. The users can then assume this IAM role while accessing the resources from the production environment

**Why this is correct:**
IAM roles are the recommended way to provide cross-account access. Users from the development account can assume a role in the production account that has the necessary permissions. The production account's role trust policy allows the development account's users/roles to assume it. This provides secure, temporary access without sharing credentials.

**Why other options are incorrect:**
- Both IAM roles and IAM users can be used interchangeably for cross-account access: IAM users are not recommended for cross-account access. Roles provide temporary credentials and better security. Users have long-lived credentials that are harder to manage across accounts.
- It is not possible to access cross-account resources: Cross-account access is absolutely possible using IAM roles. This is a standard AWS pattern for multi-account architectures.
- Create new IAM user credentials for the production environment and share these credentials: Sharing credentials violates security best practices. Credentials can be compromised, are hard to rotate, and don't provide audit trails. Roles are the secure way to provide cross-account access.""",

    55: """The correct answer is: 3

**Why this is correct:**
Spread placement groups place instances on distinct underlying hardware to minimize correlated failures. Each Availability Zone can have a maximum of 7 running instances per spread placement group. To deploy 15 instances, you need to distribute them across multiple Availability Zones. With 7 instances per AZ maximum, you need at least 3 Availability Zones (7 + 7 + 1 = 15 instances minimum across 3 AZs).

**Why other options are incorrect:**
- 7: You can only have 7 instances per AZ in a spread placement group. With 15 instances, you need more than one AZ.
- 14: This doesn't account for the 7-instance-per-AZ limit. You'd need 3 AZs minimum.
- 15: You cannot put 15 instances in a single AZ with a spread placement group due to the 7-instance limit.""",

    56: """The correct answer is: Enable Amazon DynamoDB Accelerator (DAX) for Amazon DynamoDB and Amazon CloudFront for Amazon S3

**Why this is correct:**
- DAX for DynamoDB: DAX is an in-memory caching layer specifically designed for DynamoDB. It provides microsecond latency for read operations and can cache commonly accessed data. Since 90% of reads are for commonly accessed data, DAX will dramatically improve DynamoDB read performance.
- CloudFront for S3: CloudFront is a CDN that caches static content (like images) at edge locations worldwide. This reduces latency and offloads traffic from S3, improving performance for static content delivery.

**Why other options are incorrect:**
- ElastiCache Redis for DynamoDB: ElastiCache is a general-purpose cache, but DAX is specifically optimized for DynamoDB with better integration and performance. DAX understands DynamoDB's data model and provides better caching for DynamoDB workloads.
- DAX for DynamoDB and ElastiCache Memcached for S3: S3 doesn't need ElastiCache - CloudFront is the appropriate caching/CDN solution for S3 static content. ElastiCache is for application-level caching, not object storage.
- ElastiCache Redis for DynamoDB and ElastiCache Memcached for S3: DAX is better than ElastiCache for DynamoDB, and CloudFront is better than ElastiCache for S3 static content. This combination doesn't use the optimal services.""",

    57: """The correct answer is: Use AWS Transit Gateway to interconnect the VPCs

**Why this is correct:**
AWS Transit Gateway is a network transit hub that allows you to connect multiple VPCs (and on-premises networks) through a single gateway. It's scalable and resource-efficient - you connect each VPC to the Transit Gateway once, and all VPCs can communicate. This is much more scalable than VPC peering, which requires n*(n-1)/2 peering connections for n VPCs. With 5 VPCs, peering would require 10 connections; Transit Gateway requires only 5 connections.

**Why other options are incorrect:**
- Establish VPC peering connections between all VPCs: VPC peering requires a peering connection between each pair of VPCs. For 5 VPCs, this requires 10 peering connections (A-B, A-C, A-D, A-E, B-C, B-D, B-E, C-D, C-E, D-E). This is complex to manage and doesn't scale well.
- Use an internet gateway to interconnect the VPCs: Internet Gateways provide internet access, not VPC-to-VPC connectivity. Routing VPC traffic through the internet is insecure and inefficient. VPCs should communicate privately.
- Use a VPC endpoint to interconnect the VPCs: VPC endpoints are for accessing AWS services (like S3, DynamoDB) from your VPC, not for connecting VPCs together. Endpoints don't provide VPC-to-VPC connectivity.""",

    58: """The correct answer is: Distribute the static content through Amazon S3

**Why this is correct:**
Static content (images, CSS, JavaScript) should be served from S3 (ideally with CloudFront) rather than from ECS containers. This offloads 90% of network traffic from the ECS cluster, reducing costs and improving performance. S3 is designed for static content delivery and is much more cost-effective than serving static files from compute resources. This is a standard best practice for containerized applications.

**Why other options are incorrect:**
- Distribute the static content through Amazon EFS: EFS is a network file system designed for shared storage, not static content delivery. It's more expensive than S3 for static content and doesn't provide the same performance or cost benefits. EFS is for dynamic, shared file storage.
- Distribute the dynamic content through Amazon EFS: Dynamic content needs to be generated by the application, so it should stay in ECS. The problem is static content, not dynamic content.
- Distribute the dynamic content through Amazon S3: Dynamic content is generated by the application and changes per request. S3 is for static, unchanging content. Dynamic content should remain in the application layer.""",

    59: """The correct answers are: AWS Schema Conversion Tool (AWS SCT) AND AWS Database Migration Service (AWS DMS)

**Why these are correct:**
- AWS SCT: Converts database schemas from one database engine to another. It handles complex database objects like secondary indexes, foreign keys, stored procedures, and triggers. SCT analyzes the source database and generates conversion scripts for the target database.
- AWS DMS: Handles the actual data migration and ongoing replication. It migrates data from the source database to the target while keeping them in sync. DMS works with SCT to provide a complete migration solution.

**Why other options are incorrect:**
- Basic Schema Copy: This is not an AWS service. Schema conversion requires understanding different database syntaxes and features, which SCT handles automatically.
- AWS Snowball Edge: Snowball is for physical data transfer, not database migration. It's for moving large datasets from on-premises to S3, not for migrating databases with complex schemas.
- AWS Glue: Glue is an ETL service for data transformation, not database schema conversion. It doesn't handle stored procedures, foreign keys, or other complex database objects that SCT specializes in.""",

    60: """The correct answer is: Traffic is routed to instances using the primary private IP address specified in the primary network interface for the instance

**Why this is correct:**
Network Load Balancers operate at Layer 4 (TCP/UDP) and route traffic based on IP addresses and ports. They route to instances using the instance's private IP address from the primary network interface. NLB doesn't use instance IDs, public IPs, or Elastic IPs for routing - it uses the private IP address that's assigned to the instance's primary network interface.

**Why other options are incorrect:**
- Traffic is routed using the primary elastic IP address: NLB doesn't route based on Elastic IP addresses. Elastic IPs are for public internet access, but NLB routing uses private IP addresses.
- Traffic is routed using the instance ID: Instance IDs are identifiers, not network addresses. NLB routes based on IP addresses, not instance IDs.
- Traffic is routed using the primary public IP address: NLB routes to private IP addresses, not public IPs. Public IPs are for internet-facing access, but NLB-to-instance communication uses private IPs.""",

    61: """The correct answers are: Any snapshot created from the volume is encrypted AND Data moving between the volume and the instance is encrypted AND Data at rest inside the volume is encrypted

**Why these are correct:**
When an EBS volume is encrypted:
- Snapshots are encrypted: Any snapshot taken from an encrypted volume is automatically encrypted. You cannot create an unencrypted snapshot from an encrypted volume.
- Data in transit is encrypted: Data moving between the encrypted volume and the EC2 instance is encrypted. This provides end-to-end encryption.
- Data at rest is encrypted: All data stored on the encrypted volume is encrypted at rest using AWS KMS. This meets HIPAA compliance requirements for data protection.

**Why other options are incorrect:**
- Data moving between the volume and the instance is NOT encrypted: This is incorrect. Encrypted EBS volumes provide encryption for data in transit between the volume and instance.
- Any snapshot created from the volume is NOT encrypted: This is incorrect. Snapshots from encrypted volumes are always encrypted.
- Data at rest inside the volume is NOT encrypted: This contradicts the definition of an encrypted volume. Encrypted volumes encrypt all data at rest.""",

    62: """The correct answer is: AWS VPN CloudHub

**Why this is correct:**
AWS VPN CloudHub allows multiple Site-to-Site VPN connections to connect to a single VPC, creating a hub-and-spoke topology. This enables branch offices (connected via VPN) and headquarters (connected via Direct Connect) to communicate with each other through the central VPC hub. CloudHub provides a cost-effective way to interconnect multiple remote locations without requiring additional VPN connections between each pair of locations.

**Why other options are incorrect:**
- Software VPN: This is a generic term, not an AWS service. Software VPNs don't provide the managed hub-and-spoke connectivity that CloudHub offers.
- VPC Peering connection: VPC peering connects VPCs, but the branch offices are connecting via VPN to a single VPC, not to separate VPCs. CloudHub is specifically designed for this VPN hub scenario.
- VPC Endpoint: VPC endpoints are for accessing AWS services (like S3, DynamoDB) from your VPC, not for interconnecting remote locations. Endpoints don't provide connectivity between branch offices.""",

    63: """The correct answer is: Use Amazon Redshift Spectrum to create Amazon Redshift cluster tables pointing to the underlying historical data in Amazon S3. The analytics team can then query this historical data to cross-reference with the daily reports from Redshift

**Why this is correct:**
Redshift Spectrum allows you to query data directly in S3 using the same SQL interface as Redshift. You create external tables in Redshift that point to S3 data, and you can join Spectrum tables with local Redshift tables in a single query. This provides seamless cross-referencing between current Redshift data and historical S3 data without moving data back into Redshift. It's cost-effective (pay per query) and requires minimal effort.

**Why other options are incorrect:**
- Use Redshift COPY command to load S3 data into Redshift, then remove it: This requires loading data into Redshift (incurring storage costs) and then removing it, which is inefficient. You'd need to repeat this process for each query. Spectrum queries S3 directly without loading.
- Setup access via Amazon Athena... export to flat files for cross-reference: This requires exporting data and doing manual analysis, which is time-consuming and doesn't provide seamless cross-referencing. Spectrum allows direct SQL joins.
- Use AWS Glue ETL job to load S3 data into Redshift, then remove it: Similar to the COPY approach, this loads data into Redshift temporarily, which is inefficient and costly. Spectrum queries S3 directly without ETL.""",

    64: """The correct answer is: Use Enhanced Fanout feature of Amazon Kinesis Data Streams

**Why this is correct:**
Enhanced Fanout provides dedicated throughput per consumer application. Instead of sharing throughput among consumers (which causes performance lag), each consumer gets dedicated 2MB/second throughput per shard. This dramatically improves data delivery speed for multiple consumers. Enhanced Fanout is specifically designed to solve the performance issue described - multiple consumers competing for the same stream throughput.

**Why other options are incorrect:**
- Swap out Kinesis Data Streams with Amazon SQS Standard queues: SQS doesn't provide the same real-time streaming capabilities as Kinesis. SQS is pull-based and doesn't support multiple consumers reading the same data stream efficiently. Kinesis is designed for streaming analytics.
- Swap out Kinesis Data Streams with Amazon SQS FIFO queues: Similar to standard queues, FIFO queues don't provide streaming data capabilities. They're for message queuing, not real-time data streams. FIFO queues also have lower throughput limits.
- Swap out Kinesis Data Streams with Amazon Kinesis Data Firehose: Firehose is for loading streaming data into destinations (S3, Redshift, etc.), not for multiple consumer applications. It doesn't support the multiple consumer pattern that Kinesis Data Streams provides.""",

    65: """The correct answer is: Setup an Amazon CloudWatch alarm to monitor the health status of the instance. In case of an Instance Health Check failure, an EC2 Reboot CloudWatch Alarm Action can be used to reboot the instance

**Why this is correct:**
CloudWatch can monitor EC2 instance status checks (system status and instance status). When a status check fails, CloudWatch alarms can trigger EC2 reboot actions directly without requiring Lambda functions. This is the most cost-effective and resource-efficient solution - CloudWatch alarms are inexpensive, and EC2 reboot actions don't require Lambda execution (no Lambda costs). It's also the simplest solution with minimal components.

**Why other options are incorrect:**
- Use EventBridge events to trigger Lambda to check instance status every 5 minutes: This requires Lambda execution every 5 minutes (costs money) and custom code. CloudWatch alarms with EC2 actions are simpler and more cost-effective. Also, checking every 5 minutes might miss failures.
- Setup CloudWatch alarm... publish to SNS... trigger Lambda to reboot: This adds unnecessary complexity (SNS + Lambda) when CloudWatch alarms can directly trigger EC2 reboot actions. Lambda execution costs money, while direct EC2 actions don't.
- Use EventBridge events to trigger Lambda to reboot every 5 minutes: Rebooting every 5 minutes regardless of status is wasteful and doesn't solve the problem. You need to detect failures first, then reboot. Also, Lambda execution incurs costs.""",

}

def update_test1():
    """Update test1.json with detailed explanations"""
    script_dir = os.path.dirname(__file__)
    project_root = os.path.dirname(script_dir) if os.path.basename(script_dir) == 'scripts' else script_dir
    test1_path = os.path.join(project_root, 'questions', 'test1.json')
    
    # Load test1
    with open(test1_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    # Update explanations
    updated = 0
    for question in questions:
        q_id = question['id']
        if q_id in EXPLANATIONS:
            question['explanation'] = EXPLANATIONS[q_id]
            updated += 1
    
    # Save updated file
    with open(test1_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    
    print(f"Updated {updated} explanations in test1.json")
    print(f"Total questions: {len(questions)}")
    print(f"Remaining to add: {len(questions) - updated}")

if __name__ == '__main__':
    update_test1()
