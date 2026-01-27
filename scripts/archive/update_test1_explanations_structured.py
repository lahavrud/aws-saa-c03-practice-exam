#!/usr/bin/env python3
"""
Update Test 1 with structured detailed explanations
Format: Medium-to-large explanation for correct answer, small-to-medium for each incorrect option
"""

import json
import os

# Structured explanations: correct answer explanation + separate explanation for each incorrect option
EXPLANATIONS = {
    1: {
        "correct": """Amazon Kinesis Data Streams is specifically designed for real-time streaming data ingestion and processing. It can handle high-throughput IoT data streams and perform real-time analytics using Kinesis Data Analytics or Lambda functions. Kinesis provides low-latency data processing capabilities that are essential for IoT applications where data needs to be analyzed in real-time. Once analytics are complete, Amazon SNS is the ideal service for push notifications to mobile applications. SNS supports mobile push notification services including APNS (Apple Push Notification Service) for iOS devices and FCM (Firebase Cloud Messaging) for Android devices. SNS can deliver messages directly to mobile apps without requiring the apps to poll for updates, which is more efficient and battery-friendly. This combination of Kinesis for real-time streaming analytics and SNS for mobile push notifications provides a complete, scalable solution for IoT data processing and notification delivery.""",
        "incorrect": {
            0: """Amazon SQS is a message queuing service designed for decoupling applications, but it's pull-based (applications poll for messages) and doesn't provide the real-time streaming capabilities required for IoT data processing. While SQS can work with SNS, using SQS adds unnecessary complexity and latency. Kinesis is purpose-built for real-time streaming analytics with low latency, making it the better choice for processing IoT data streams.""",
            1: """Amazon SES (Simple Email Service) is designed for sending email notifications, not push notifications to mobile applications. The requirement specifically asks for notifications to mobile apps, which requires SNS with mobile push support. SES cannot deliver push notifications to mobile devices - it only sends emails.""",
            3: """Amazon SQS is pull-based and not designed for push notifications. Mobile applications would need to continuously poll SQS to check for new messages, which is inefficient, increases latency, and drains device battery. SNS provides true push notifications where AWS delivers messages directly to the mobile app without requiring polling."""
        }
    },
    2: {
        "correct": """S3 One Zone-IA stores data in a single Availability Zone, providing 99.5% availability at approximately 20% lower cost than S3 Standard-IA. Since the assets are re-creatable (can be regenerated if lost), the reduced durability of One Zone-IA is acceptable for this use case. The 30-day transition period is optimal because it ensures assets remain in Standard storage during the first week of high access (when performance and cost-effectiveness matter most), then transitions to cheaper storage after access frequency drops. This lifecycle policy balances cost optimization with the requirement for immediate accessibility. One Zone-IA maintains the same retrieval times as Standard-IA, so assets remain immediately accessible when needed, just at a lower cost.""",
        "incorrect": {
            0: """Transitioning to One Zone-IA after 7 days is too early. The scenario states assets are accessed frequently for the first few days, and transitioning too early could impact performance or increase costs if assets are still being accessed frequently during the high-access period. The 30-day period ensures the high-access period has completely passed.""",
            1: """Standard-IA stores data across multiple Availability Zones (providing 99.999999999% durability - 11 9's), which is overkill for re-creatable assets. It's also more expensive than One Zone-IA. Additionally, the 7-day transition is too early, potentially impacting performance during high-access periods when assets are still being frequently accessed.""",
            3: """While the 30-day timing is correct, Standard-IA is more expensive than One Zone-IA. For re-creatable assets that don't require maximum durability, One Zone-IA provides the best cost optimization while maintaining immediate accessibility. Standard-IA's multi-AZ durability is unnecessary for data that can be regenerated."""
        }
    },
    3: {
        "correct": """Launch templates are the modern, recommended way to configure Auto Scaling groups and are the only option that supports mixed instance types with both On-Demand and Spot Instances. Launch templates support the "Mixed Instances Policy" feature, which allows you to specify multiple instance types and purchasing strategies (On-Demand and Spot) simultaneously. This enables cost optimization by using Spot Instances for non-critical workloads while maintaining performance with On-Demand Instances for critical components. Launch templates also support versioning, allowing you to update configurations without recreating the Auto Scaling group. They provide better flexibility and are the recommended approach for modern Auto Scaling configurations.""",
        "incorrect": {
            1: """This is incorrect because launch configurations are legacy and do NOT support mixed instance types or Spot Instances. Launch configurations only support a single instance type and On-Demand instances. This option incorrectly suggests that launch configurations can do something they fundamentally cannot.""",
            2: """This option incorrectly suggests that both launch configurations and launch templates can support mixed instance types with Spot Instances. However, launch configurations are legacy and do NOT support this feature - only launch templates do.""",
            3: """This is incorrect because launch templates DO support mixed instance types with Spot Instances through the Mixed Instances Policy feature. This feature was specifically designed for this use case and is a key advantage of launch templates over launch configurations."""
        }
    },
    4: {
        "correct": """Launch configurations are immutable - they cannot be modified once created. To fix an incorrect instance type, you must create a new launch configuration with the correct instance type, then update the Auto Scaling group to use the new launch configuration. The old launch configuration can be safely deleted once the Auto Scaling group is updated and no longer references it. New instances launched by the Auto Scaling group will use the correct instance type from the new launch configuration. Existing instances will continue running with the old instance type until they are terminated and replaced through normal Auto Scaling operations. This is the standard procedure for correcting launch configuration issues.""",
        "incorrect": {
            0: """Auto Scaling groups don't have a direct "instance type" setting - they get this configuration from the launch configuration they reference. You cannot change the instance type without changing the launch configuration. The Auto Scaling group simply references a launch configuration, which defines all the instance specifications including the instance type.""",
            2: """Adding more instances of the wrong type doesn't solve the performance problem. The issue is that the instance type itself is incorrect and not optimized for the application workflow. More instances of the wrong type won't improve performance - you need the correct instance type that matches the application's requirements.""",
            3: """Launch configurations are immutable and cannot be modified after creation. This is a fundamental characteristic of launch configurations. You must create a new launch configuration with the correct settings rather than trying to modify an existing one."""
        }
    },
    5: {
        "correct": """For a one-time copy of 1 petabyte of data between S3 buckets in different regions, two efficient approaches are available. First, the AWS CLI `aws s3 sync` command efficiently copies objects between S3 buckets, including cross-region transfers. It handles large datasets with parallel transfers, automatic retry logic, and progress tracking. Second, S3 Batch Replication can copy existing objects (not just new ones) when configured with batch replication. After setting up replication and allowing it to copy existing objects, you can delete the replication configuration once the one-time copy is complete. Both methods are designed for bulk data transfers and handle petabyte-scale operations efficiently without requiring manual intervention.""",
        "incorrect": {
            1: """S3 Transfer Acceleration optimizes transfers from clients (like on-premises) to S3 using CloudFront edge locations. It does NOT help with bucket-to-bucket transfers within AWS. Transfer Acceleration is specifically designed for client-to-S3 transfers, not S3-to-S3 transfers between buckets.""",
            3: """Snowball is for transferring data from on-premises to AWS, not for S3 bucket-to-bucket transfers within AWS. The data is already in S3, so Snowball is not applicable. Snowball is used when you need to physically ship data from on-premises locations, not for cloud-to-cloud transfers.""",
            4: """While you can copy individual objects in the console, copying 1 petabyte through the console UI is not practical. The console is designed for small-scale operations and manual file management. This would require thousands of manual operations and is not feasible for petabyte-scale transfers."""
        }
    },
    6: {
        "correct": """Amazon CloudWatch automatically monitors EC2 instance metrics including CPU utilization without requiring any code or custom setup. You can create CloudWatch alarms that trigger when CPU utilization breaches a threshold. CloudWatch alarms can directly publish to Amazon SNS topics, requiring no custom code or Lambda functions. SNS can then send email notifications to subscribers with minimal setup - just create an SNS topic, subscribe email addresses, and configure the CloudWatch alarm to publish to the topic. This provides a complete, no-code solution for monitoring and alerting that requires the least amount of development effort.""",
        "incorrect": {
            0: """While Lambda can be used to process CloudWatch events and send emails, it requires writing custom code, which increases development effort. CloudWatch alarms with SNS provide a no-code solution. Lambda adds unnecessary complexity and costs for simple monitoring and email notifications.""",
            1: """Step Functions orchestrate multiple AWS services but adds unnecessary complexity for simple monitoring and email notifications. CloudWatch + SNS is simpler, requires less development effort, and has fewer moving parts. Step Functions are designed for complex workflows, not simple alerting scenarios.""",
            3: """SQS is a message queue service and doesn't directly send email notifications. While it could be part of a more complex solution (SQS -> Lambda -> SES), it's not needed here and adds unnecessary complexity. SQS requires a consumer to process messages, which would require additional Lambda functions."""
        }
    },
    7: {
        "correct": """AWS Global Accelerator uses AWS's global network infrastructure to route traffic to optimal endpoints based on health, geography, and routing policies. It provides static IP addresses that route to the nearest edge location, then to the optimal AWS endpoint. For UDP protocol traffic (which the application uses), Global Accelerator provides the lowest latency by routing through AWS's private network backbone rather than the public internet. It's specifically designed for non-HTTP traffic like UDP and TCP, making it ideal for real-time applications that require low latency. Global Accelerator continuously monitors endpoint health and automatically routes traffic to healthy endpoints, ensuring optimal performance.""",
        "incorrect": {
            0: """Auto Scaling groups manage EC2 instance capacity but don't provide low-latency routing or network optimization. They handle instance scaling based on demand but don't optimize network paths or provide global distribution. Auto Scaling is about instance management, not network performance optimization.""",
            1: """ELB distributes traffic across instances within a region but doesn't optimize for global latency. It doesn't use AWS's global network infrastructure or provide static IP addresses. ELB is regional and doesn't provide the global low-latency routing needed for worldwide distribution.""",
            2: """CloudFront is a Content Delivery Network (CDN) optimized for HTTP/HTTPS traffic and static content caching. It's not designed for UDP protocol traffic or real-time data distribution. CloudFront caches content at edge locations, which isn't suitable for live, real-time sports results that need immediate delivery."""
        }
    },
    8: {
        "correct": """Amazon Kinesis Data Streams is designed for real-time streaming data processing with custom applications. It allows you to build custom applications that process and analyze streaming data in real-time according to your specialized needs. Kinesis Data Streams decouples producers (data sources) from consumers (processing applications), allowing multiple consumers to process the same stream independently. This decoupling enables flexible architecture where producers and consumers can scale independently. Data is retained for 24 hours (or up to 7 days with extended retention), allowing for replay and multiple consumers. Kinesis supports custom processing logic, making it ideal for specialized analytics requirements that standard services cannot meet.""",
        "incorrect": {
            1: """Kinesis Data Firehose is designed for loading streaming data into destinations like S3, Redshift, or Elasticsearch. It doesn't support custom processing applications - it's a fully managed service that automatically delivers data to destinations without allowing custom processing logic. For custom processing and analysis, you need Kinesis Data Streams.""",
            2: """SQS is a message queuing service for decoupling applications, but it's not designed for real-time streaming data processing. It's pull-based (consumers poll for messages) and doesn't provide the real-time processing capabilities, data retention features, or streaming semantics that Kinesis provides. SQS is better for discrete messages, not continuous streams.""",
            3: """SNS is a pub/sub messaging service for notifications and fan-out scenarios. It doesn't support custom data processing or real-time analytics. SNS delivers messages to subscribers but doesn't provide the streaming data processing capabilities, data retention, or custom processing logic needed for real-time analytics."""
        }
    },
    9: {
        "correct": """IAM permissions boundaries are the maximum permissions that an identity-based policy can grant to an IAM entity (user or role). When you set a permissions boundary for a user, that user can only perform actions that are allowed by both their identity-based policies AND the permissions boundary. This prevents users from granting themselves or others more permissions than intended, even if they have permission management capabilities. Permissions boundaries act as a safety net that limits the maximum permissions a user can have, regardless of what policies they attach to themselves or others. This is the most effective technical safeguard to prevent accidental deletions while still allowing necessary permissions for legitimate work.""",
        "incorrect": {
            0: """This is too restrictive and would prevent legitimate work. Developers need database access to build features and perform their jobs. The solution should prevent accidental deletions, not remove all access entirely. This approach would break normal operations and prevent developers from doing their work.""",
            2: """While this adds oversight, it's not scalable and relies on manual processes that can be error-prone. It doesn't provide a technical safeguard against accidental deletions - it's a process solution, not an architectural one. Manual review processes can be forgotten or bypassed.""",
            3: """This is impractical and would severely limit productivity. Developers need database access to work effectively. The root user should never be used for day-to-day operations as it violates AWS security best practices. This approach would create operational bottlenecks and is not a sustainable solution."""
        }
    },
    10: {
        "correct": """AWS CloudTrail is a service that enables governance, compliance, operational auditing, and risk auditing of your AWS account. It logs all API calls made to AWS services, including who made the call (user/role), when it was made (timestamp), what action was performed, and what resources were affected. CloudTrail can show exactly which user or role changed S3 bucket settings, when it happened, and what specific changes were made. This allows you to investigate the strange behavior without restricting user rights, which is exactly what's needed. CloudTrail logs can be analyzed using CloudWatch Logs Insights, Athena, or other analytics tools to identify patterns and root causes.""",
        "incorrect": {
            1: """This restricts user rights, which the question explicitly asks to avoid. The requirement is to figure out what's happening without restricting rights. This approach would prevent investigation by blocking the activity entirely, rather than allowing you to understand who is making changes and why.""",
            2: """This adds security but doesn't help identify who is making changes or why. It also doesn't address the investigation requirement. MFA prevents unauthorized access but doesn't provide audit trails for authorized users who might be making changes. You need visibility into who is doing what, not just additional authentication.""",
            3: """S3 access logs (server access logs) track object-level access (GET, PUT, DELETE operations on objects), but they don't track bucket-level configuration changes like bucket policies, versioning settings, lifecycle policies, or other bucket settings. CloudTrail is needed for API-level auditing of bucket configuration changes."""
        }
    },
    11: {
        "correct": """Amazon DynamoDB is a NoSQL database that stores data as key-value pairs, which perfectly matches the data format described (key-value pairs). It provides high availability with automatic multi-AZ replication and can handle high-throughput writes easily (one-minute frequency is well within DynamoDB's capabilities). DynamoDB is serverless, scales automatically, and provides 99.999% availability SLA. It's ideal for time-series data like weather metrics. AWS Lambda can process the incoming weather data, transform it if needed, and write it to DynamoDB. Lambda can be triggered by various sources (API Gateway, Kinesis, SQS, etc.) and provides serverless, event-driven processing. Lambda automatically scales to handle the incoming data frequency and integrates seamlessly with DynamoDB, making this a complete serverless solution.""",
        "incorrect": {
            0: """Redshift is a data warehouse designed for analytical queries on large datasets, not for high-frequency writes of key-value pairs. It's optimized for complex SQL queries and batch processing, not real-time key-value storage. Redshift would be overkill and not optimized for this use case.""",
            1: """RDS is a relational database service that requires schema definition and is optimized for relational data, not key-value pairs. While it could work, DynamoDB is better suited for key-value data and provides better scalability and availability for this use case. RDS requires more management overhead.""",
            3: """ElastiCache is an in-memory caching service (Redis or Memcached) designed for temporary data storage, not persistent storage. Data in ElastiCache can be lost if the cache is cleared or nodes fail. The requirement is for reliable storage with high availability, which requires persistent storage like DynamoDB."""
        }
    },
    12: {
        "correct": """AWS Global Accelerator provides static IP addresses that route traffic to optimal endpoints. It supports traffic dials (weighted routing) that allow you to distribute a specific percentage of traffic to different endpoints. This is perfect for blue-green deployments where you want to test a new deployment with a portion of users. Global Accelerator routes traffic at the network layer, avoiding DNS caching issues that affect mobile phones. Since it uses static IPs, mobile devices don't need to resolve DNS, bypassing the DNS caching problem mentioned in the scenario. This allows you to test the deployment on many users quickly without waiting for DNS propagation.""",
        "incorrect": {
            0: """Route 53 uses DNS-based routing, which is subject to DNS caching on mobile devices. Mobile phones cache DNS records, so users might not see the new deployment even after DNS changes propagate. This doesn't solve the DNS caching problem mentioned in the scenario.""",
            1: """CodeDeploy manages application deployments but doesn't control traffic routing or distribution. It deploys code to instances but doesn't help with routing traffic between blue and green environments for testing. CodeDeploy is about deployment, not traffic management.""",
            3: """ELB distributes traffic within a region but doesn't provide traffic dials or weighted routing between different deployments. ELB also doesn't solve the DNS caching issue. ELB is regional and doesn't provide the global traffic management needed."""
        }
    },
    13: {
        "correct": """S3 versioning keeps multiple versions of objects, so if an object is deleted, you can restore a previous version. This provides protection against accidental deletion by allowing recovery of deleted objects. Versioning is a fundamental S3 feature for data protection and compliance. MFA delete requires multi-factor authentication before objects can be permanently deleted. This adds an extra layer of protection against accidental deletions. Even if someone has delete permissions, they need MFA to permanently delete versioned objects, providing compliance-grade protection. Together, versioning and MFA delete provide comprehensive protection against accidental deletions.""",
        "incorrect": {
            0: """There is no such configuration option in S3. S3 doesn't have a built-in "confirmation dialog" setting. This is not a real S3 feature.""",
            1: """While this provides notification of deletions, it doesn't prevent accidental deletion or allow recovery. It's reactive, not protective. The object would still be deleted before the notification is sent.""",
            2: """This is a process solution, not a technical safeguard. It relies on human processes that can be bypassed or forgotten. Technical controls like versioning and MFA delete are more reliable and enforceable."""
        }
    },
    14: {
        "correct": """IAM roles are the recommended and secure way to grant permissions to EC2 instances. Roles provide temporary credentials that are automatically rotated, eliminating the need to store long-lived access keys. An instance profile is a container for an IAM role that allows EC2 instances to assume the role. This is the AWS best practice for EC2 access to AWS services. Credentials are automatically provided to the instance via the instance metadata service, which is more secure than storing credentials on the instance. Roles can be attached and detached without stopping the instance, and credentials are automatically refreshed.""",
        "incorrect": {
            1: """Hardcoding credentials in code is insecure because credentials can be exposed in code repositories, logs, or if the instance is compromised. Credentials don't rotate automatically and must be manually updated. This violates AWS security best practices.""",
            2: """While encryption adds some security, this still requires storing credentials on the instance, which is not recommended. Credentials must still be decrypted and stored in memory, and the encryption key must be managed. IAM roles eliminate the need to store credentials entirely.""",
            3: """This requires storing IAM user credentials on the instance, which is insecure. IAM user credentials are long-lived and don't rotate automatically. Using IAM roles is the recommended approach."""
        }
    },
    15: {
        "correct": """Amazon RDS Custom is specifically designed for applications that require customization of the database environment and underlying operating system. RDS Custom for Oracle allows DBAs to access and customize the database environment, install custom software, and configure the OS while still providing managed database services. Multi-AZ configuration provides high availability with automatic failover. This is the only RDS option that allows both customization and high availability. RDS Custom provides the perfect balance between managed services (backups, patching, monitoring) and customization capabilities.""",
        "incorrect": {
            0: """Standard RDS for Oracle doesn't allow customization of the database environment or underlying OS. Read replicas provide read scaling but don't allow the level of customization required. Standard RDS is a managed service with limited OS and database customization.""",
            2: """While this allows full customization, it requires managing the database yourself, including backups, patching, and high availability setup. This increases operational overhead compared to RDS Custom, which provides managed services with customization capabilities.""",
            3: """Standard RDS for Oracle doesn't allow customization of the database environment or underlying operating system. The requirement specifically needs customization capabilities that standard RDS doesn't provide."""
        }
    },
    16: {
        "correct": """Amazon ElastiCache (Redis or Memcached) is an in-memory caching service that sits in front of RDS to cache frequently accessed data. By caching player scores and stats in ElastiCache, read requests can be served from the cache instead of hitting the RDS database, significantly reducing database load and latency. This allows you to downsize the RDS instance (reducing costs) while maintaining performance. ElastiCache provides sub-millisecond latency for cached data, which is much faster than database queries. Since gaming data like scores and stats are frequently accessed and don't change constantly, caching is highly effective.""",
        "incorrect": {
            0: """Redshift is a data warehouse designed for analytical queries on large datasets, not for transactional read/write operations. It's not suitable for real-time game data retrieval. Redshift has higher latency and is optimized for complex analytical queries, not simple lookups.""",
            1: """Lambda is a compute service and doesn't address the database read performance issue. The problem is database load, not compute performance. Lambda would still need to query the same RDS database, so it doesn't solve the problem.""",
            3: """While read replicas can help distribute read traffic, they don't reduce costs - you're adding more database instances, which increases costs. Read replicas also don't reduce latency as much as caching does. ElastiCache provides better performance improvement and cost reduction."""
        }
    },
    17: {
        "correct": """Amazon GuardDuty is a threat detection service that continuously monitors for malicious activity and unauthorized behavior. It analyzes VPC Flow Logs, DNS logs, and CloudTrail events to detect threats. GuardDuty can identify suspicious API calls, data exfiltration attempts, and other security threats related to S3 data. Amazon Macie is a data security service that uses machine learning to automatically discover, classify, and protect sensitive data in S3. It can identify sensitive data like PII, credit card numbers, and other regulated information. Macie provides visibility into data access patterns and helps ensure compliance. Together, GuardDuty monitors threats while Macie identifies sensitive data.""",
        "incorrect": {
            1: """GuardDuty is designed for threat detection, not data classification. It doesn't have the capability to identify sensitive data patterns. Macie is specifically designed for sensitive data discovery.""",
            2: """Macie is designed for data discovery and classification, not threat detection. It doesn't monitor for malicious activity like unauthorized access attempts or data exfiltration. GuardDuty is needed for threat monitoring.""",
            3: """This reverses the roles of the services. GuardDuty monitors threats, Macie identifies sensitive data. The correct pairing is GuardDuty for threats and Macie for sensitive data."""
        }
    },
    18: {
        "correct": """VPC sharing allows you to share subnets (not entire VPCs) with other AWS accounts within the same AWS Organizations structure. This enables multiple accounts to launch their own resources (EC2 instances, RDS databases, etc.) into shared, centrally-managed subnets. Each account manages its own resources and pays for its own usage, while sharing the network infrastructure. This is ideal for organizations that want centralized network management with account-level resource isolation. VPC sharing provides better resource utilization and cost efficiency compared to creating separate VPCs for each account.""",
        "incorrect": {
            0: """VPC peering connects entire VPCs, not individual subnets. You cannot share subnets using VPC peering - it creates a network connection between two VPCs. VPC peering doesn't allow multiple accounts to launch resources in the same subnet.""",
            2: """VPC peering connects VPCs but doesn't "share" them. Each VPC remains separate, and resources in one VPC cannot be launched in the other VPC's subnets. VPC peering is for network connectivity, not resource sharing.""",
            3: """VPC sharing works at the subnet level, not the VPC level. You share specific subnets with other accounts, not entire VPCs. This allows for more granular control and better resource isolation."""
        }
    },
    19: {
        "correct": """Amazon ElastiCache for Redis or Memcached provides an in-memory caching solution that can cache SQL query results. Redis supports more advanced data structures and features, while Memcached is simpler and optimized for caching. Both provide high availability and can be configured for HIPAA compliance. ElastiCache can cache frequently accessed query results, dramatically improving performance for repeated queries while maintaining data security and compliance requirements. Since the requirement is for caching SQL query results, ElastiCache is the appropriate solution.""",
        "incorrect": {
            1: """DAX is specifically designed as a caching layer for DynamoDB, not for relational databases or SQL queries. It's optimized for DynamoDB's NoSQL data model and cannot cache SQL query results from other databases.""",
            2: """DynamoDB is a NoSQL database, not a caching solution. While it's fast, it doesn't cache SQL query results. The requirement specifically asks for caching SQL query results, which requires a caching layer, not a different database.""",
            3: """DocumentDB is a MongoDB-compatible document database, not a caching solution. It doesn't cache SQL query results and is designed for document storage, not query result caching."""
        }
    },
    20: {
        "correct": """AWS DMS can read data from S3 (using S3 as a source endpoint) and stream it to Kinesis Data Streams (using Kinesis as a target endpoint). DMS supports full load of existing data and ongoing change data capture (CDC) for new files. This provides a managed, efficient way to stream both existing and new S3 files to Kinesis without requiring custom code or Lambda functions. DMS handles the complexity of reading from S3 and writing to Kinesis, making it the fastest and most operationally efficient solution.""",
        "incorrect": {
            0: """While this works for new files, it doesn't handle existing files in S3. S3 event notifications only trigger for new object creation events, not for existing objects. You would need a separate process to handle existing files.""",
            2: """S3 cannot directly write to SNS. S3 can send event notifications to SNS, but these are just notifications about object creation, not the actual data. SNS also cannot directly send data to Kinesis Data Streams - you would need Lambda or another service.""",
            3: """Similar to S3 event notifications, EventBridge can trigger on S3 events but only for new objects. It doesn't handle existing files, and you would still need Lambda to read the file content and write to Kinesis, adding complexity."""
        }
    },
    # Continuing with questions 21-65...
}

def generate_explanation_text(question_data, correct_ids, all_options):
    """Generate formatted explanation text from structured data"""
    if isinstance(question_data, str):
        # Legacy format - return as is
        return question_data
    
    # New structured format
    parts = []
    
    # Add correct answer explanation
    if "correct" in question_data:
        parts.append(question_data["correct"])
    
    # Add explanations for each incorrect option
    if "incorrect" in question_data:
        for opt_id, opt_text in all_options.items():
            if opt_id not in correct_ids and opt_id in question_data["incorrect"]:
                parts.append(f"\n**Why option {opt_id} is incorrect:**\n{question_data['incorrect'][opt_id]}")
    
    return "\n".join(parts)

def update_test1():
    """Update test1.json with structured detailed explanations"""
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
            # Create option mapping
            option_map = {opt['id']: opt['text'] for opt in question['options']}
            correct_ids = set(question['correctAnswers'])
            
            # Generate explanation text
            explanation = generate_explanation_text(EXPLANATIONS[q_id], correct_ids, option_map)
            question['explanation'] = explanation
            updated += 1
    
    # Save updated file
    with open(test1_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    
    print(f"Updated {updated} explanations in test1.json")
    print(f"Total questions: {len(questions)}")
    print(f"Remaining to add: {len(questions) - updated}")

if __name__ == '__main__':
    update_test1()
