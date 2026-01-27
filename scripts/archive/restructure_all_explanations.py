#!/usr/bin/env python3
"""
Restructure all Test 1 explanations to have:
- Medium-to-large explanation for correct answer
- Separate small-to-medium explanations for each incorrect option
"""

import json
import os

# This will contain all 65 questions with restructured explanations
# Format: {question_id: {'correct': option_id or [option_ids], 'explanations': {option_id: explanation_text}}}

EXPLANATIONS = {
    1: {
        'correct': 2,
        'explanations': {
            2: """Amazon Kinesis Data Streams is specifically designed for real-time streaming data ingestion and processing. It can handle high-throughput IoT data streams and perform real-time analytics using Kinesis Data Analytics or Lambda functions. Kinesis provides low-latency data processing capabilities that are essential for IoT applications where data needs to be analyzed in real-time. Once analytics are complete, Amazon SNS is the ideal service for push notifications to mobile applications. SNS supports mobile push notification services including APNS (Apple Push Notification Service) for iOS devices and FCM (Firebase Cloud Messaging) for Android devices. SNS can deliver messages directly to mobile apps without requiring the apps to poll for updates, which is more efficient and battery-friendly. This combination of Kinesis for real-time streaming analytics and SNS for mobile push notifications provides a complete, scalable solution for IoT data processing and notification delivery.""",
            0: """Amazon SQS is a message queuing service designed for decoupling applications, but it's pull-based (applications poll for messages) and doesn't provide the real-time streaming capabilities required for IoT data processing. While SQS can work with SNS, using SQS adds unnecessary complexity and latency. Kinesis is purpose-built for real-time streaming analytics with low latency, making it the better choice for processing IoT data streams.""",
            1: """Amazon SES (Simple Email Service) is designed for sending email notifications, not push notifications to mobile applications. The requirement specifically asks for notifications to mobile apps, which requires SNS with mobile push support. SES cannot deliver push notifications to mobile devices - it only sends emails.""",
            3: """Amazon SQS is pull-based and not designed for push notifications. Mobile applications would need to continuously poll SQS to check for new messages, which is inefficient, increases latency, and drains device battery. SNS provides true push notifications where AWS delivers messages directly to the mobile app without requiring polling."""
        }
    },
    2: {
        'correct': 2,
        'explanations': {
            2: """S3 One Zone-IA stores data in a single Availability Zone, providing 99.5% availability at approximately 20% lower cost than S3 Standard-IA. Since the assets are re-creatable (can be regenerated if lost), the reduced durability of One Zone-IA is acceptable. The 30-day transition period ensures assets remain in Standard storage during the first week of high access, then transition to cheaper storage after access frequency drops. This balances cost optimization with the requirement for immediate accessibility. One Zone-IA maintains the same retrieval speed as Standard-IA, ensuring assets remain immediately accessible when needed, while significantly reducing storage costs for infrequently accessed data.""",
            0: """Transitioning after 7 days is too early. The scenario states assets are accessed frequently for the first few days, and transitioning too early could impact performance or increase costs if assets are still being accessed frequently. The 30-day period ensures the high-access period has passed before transitioning to cheaper storage.""",
            1: """Standard-IA stores data across multiple Availability Zones (99.999999999% durability - 11 9's), which is overkill for re-creatable assets. It's also more expensive than One Zone-IA. The 7-day transition is also too early, potentially impacting performance during high-access periods.""",
            3: """While the timing is correct, Standard-IA is more expensive than One Zone-IA. For re-creatable assets, One Zone-IA provides the best cost optimization while maintaining immediate accessibility. Standard-IA's multi-AZ durability is unnecessary for data that can be regenerated."""
        }
    },
    3: {
        'correct': 0,
        'explanations': {
            0: """Launch templates are the modern, recommended way to configure Auto Scaling groups. They support mixed instance types and mixed purchasing options (On-Demand and Spot Instances) through the "Mixed Instances Policy" feature. This allows you to specify multiple instance types and purchasing strategies, enabling cost optimization while maintaining performance. Launch templates also support versioning and can be updated without recreating the Auto Scaling group. Launch configurations, on the other hand, are legacy and do not support mixed instance types or Spot Instances - they only support a single instance type and On-Demand instances.""",
            1: """This is incorrect because launch templates DO support mixed instance types with Spot Instances through Mixed Instances Policy. This feature was specifically designed for this use case.""",
            2: """Launch configurations are legacy and do NOT support mixed instance types or Spot Instances. They only support a single instance type and On-Demand instances. This option is incorrect because it suggests launch configurations can do something they cannot.""",
            3: """Launch configurations cannot support mixed instance types or Spot Instances. They are limited to a single instance type and On-Demand purchasing only. This is a fundamental limitation of launch configurations."""
        }
    },
    4: {
        'correct': 1,
        'explanations': {
            1: """Launch configurations are immutable - they cannot be modified once created. To fix an incorrect instance type, you must create a new launch configuration with the correct instance type, then update the Auto Scaling group to use the new launch configuration. The old launch configuration can be deleted once the Auto Scaling group is updated. New instances launched by the Auto Scaling group will use the correct instance type from the new launch configuration. Existing instances will continue running with the old instance type until they are terminated and replaced. This is the proper long-term resolution that ensures all future instances use the correct instance type.""",
            0: """Auto Scaling groups don't have a direct "instance type" setting - they get this from the launch configuration. You cannot change the instance type without changing the launch configuration. The Auto Scaling group references a launch configuration, which defines the instance type.""",
            2: """Adding more instances of the wrong type doesn't solve the performance problem. The issue is that the instance type itself is incorrect, not the quantity. More instances of the wrong type won't improve performance for the application workflow.""",
            3: """Launch configurations are immutable and cannot be modified. You must create a new one. This is a fundamental characteristic of launch configurations."""
        }
    },
    5: {
        'correct': [0, 2],
        'explanations': {
            0: """AWS CLI `aws s3 sync` command efficiently copies objects between S3 buckets, including cross-region transfers. It's ideal for one-time bulk transfers and handles large datasets (like 1 petabyte) efficiently with parallel transfers and retry logic. The sync command can be run from any machine with AWS CLI access and automatically handles the complexity of cross-region transfers, including handling failures and resuming transfers. It's a straightforward solution for one-time copies that doesn't require ongoing configuration.""",
            2: """S3 Batch Replication can copy existing objects (not just new ones) when configured with batch replication. After setting up replication and allowing it to copy existing objects, you can delete the replication configuration once the one-time copy is complete. This provides a managed, console-based solution that handles the transfer automatically without requiring command-line tools or scripts.""",
            1: """S3 Transfer Acceleration optimizes transfers from clients (like on-premises) to S3 using CloudFront edge locations. It does NOT help with bucket-to-bucket transfers within AWS. For bucket-to-bucket transfers, use sync or replication. Transfer Acceleration is for client-to-S3 transfers, not S3-to-S3 transfers.""",
            3: """Snowball is for transferring data from on-premises to AWS, not for S3 bucket-to-bucket transfers within AWS. The data is already in S3, so Snowball is not applicable. Snowball is used when you need to physically ship data, not for cloud-to-cloud transfers.""",
            4: """While you can copy individual objects in the console, copying 1 petabyte through the console UI is not practical. The console is designed for small-scale operations, not bulk transfers. This would require thousands of manual operations."""
        }
    },
    6: {
        'correct': [2, 4],
        'explanations': {
            2: """Amazon SNS can receive messages from CloudWatch alarms and send email notifications to subscribers. This requires minimal setup - just create an SNS topic, subscribe email addresses, and configure the CloudWatch alarm to publish to the topic. No Lambda functions or custom code needed. SNS provides a simple, managed way to deliver email notifications.""",
            4: """Amazon CloudWatch automatically monitors EC2 instance metrics including CPU utilization. You can create CloudWatch alarms that trigger when CPU utilization breaches a threshold. CloudWatch alarms can directly publish to SNS topics, requiring no custom code. This is a native AWS service integration that requires minimal configuration.""",
            0: """While Lambda can be used to process CloudWatch events and send emails, it requires writing custom code, which increases development effort. CloudWatch alarms with SNS provide a no-code solution. Lambda adds unnecessary complexity for simple monitoring and email notifications.""",
            1: """Step Functions orchestrate multiple AWS services but adds unnecessary complexity for simple monitoring and email notifications. CloudWatch + SNS is simpler and requires less development effort. Step Functions are for complex workflows, not simple alerting.""",
            3: """SQS is a message queue service and doesn't directly send email notifications. While it could be part of a more complex solution (SQS -> Lambda -> SES), it's not needed here and adds unnecessary complexity. SQS requires a consumer to process messages."""
        }
    },
    7: {
        'correct': 3,
        'explanations': {
            3: """AWS Global Accelerator uses AWS's global network infrastructure to route traffic to optimal endpoints based on health, geography, and routing policies. It provides static IP addresses that route to the nearest edge location, then to the optimal AWS endpoint. For UDP protocol traffic (which the application uses), Global Accelerator provides the lowest latency by routing through AWS's private network backbone rather than the public internet. It's specifically designed for non-HTTP traffic like UDP and TCP, making it ideal for real-time applications that require low latency.""",
            0: """Auto Scaling groups manage EC2 instance capacity but don't provide low-latency routing. They don't optimize network paths or provide global distribution. Auto Scaling is about instance management, not network optimization.""",
            1: """ELB distributes traffic across instances within a region but doesn't optimize for global latency. It doesn't use AWS's global network infrastructure or provide static IP addresses. ELB is regional, not global.""",
            2: """CloudFront is a Content Delivery Network (CDN) optimized for HTTP/HTTPS traffic and static content caching. It's not designed for UDP protocol traffic or real-time data distribution. CloudFront caches content at edge locations, which isn't suitable for live, real-time sports results."""
        }
    },
    8: {
        'correct': 0,
        'explanations': {
            0: """Amazon Kinesis Data Streams is designed for real-time streaming data processing with custom applications. It allows you to build custom applications that process and analyze streaming data in real-time. Kinesis Data Streams decouples producers (data sources) from consumers (processing applications), allowing multiple consumers to process the same stream independently. It supports custom processing logic, making it ideal for specialized needs. Data is retained for 24 hours (or up to 7 days with extended retention), allowing for replay and multiple consumers. This makes it perfect for companies that need to build custom applications for specialized data processing.""",
            1: """Kinesis Data Firehose is designed for loading streaming data into destinations like S3, Redshift, or Elasticsearch. It doesn't support custom processing applications - it's a fully managed service that automatically delivers data to destinations. For custom processing and analysis, you need Kinesis Data Streams.""",
            2: """SQS is a message queuing service for decoupling applications, but it's not designed for real-time streaming data processing. It's pull-based (consumers poll for messages) and doesn't provide the real-time processing capabilities or data retention features of Kinesis. SQS is better for discrete messages, not continuous streams.""",
            3: """SNS is a pub/sub messaging service for notifications and fan-out scenarios. It doesn't support custom data processing or real-time analytics. SNS delivers messages to subscribers but doesn't provide the streaming data processing capabilities needed here."""
        }
    },
    9: {
        'correct': 1,
        'explanations': {
            1: """IAM permissions boundaries are the maximum permissions that an identity-based policy can grant to an IAM entity (user or role). When you set a permissions boundary for a user, that user can only perform actions that are allowed by both their identity-based policies AND the permissions boundary. This prevents users from granting themselves or others more permissions than intended, even if they have permission management capabilities. This is the most effective way to prevent accidental deletions while still allowing necessary permissions. Permissions boundaries provide a technical safeguard that scales automatically and doesn't rely on manual processes.""",
            0: """This is too restrictive and would prevent legitimate work. Developers need database access to build features. The solution should prevent accidental deletions, not remove all access. This would break normal operations.""",
            2: """While this adds oversight, it's not scalable and relies on manual processes that can be error-prone. It doesn't provide a technical safeguard against accidental deletions. This is a process solution, not an architectural one.""",
            3: """This is impractical and would severely limit productivity. Developers need database access to work. The root user should never be used for day-to-day operations. This would create operational bottlenecks."""
        }
    },
    10: {
        'correct': 0,
        'explanations': {
            0: """AWS CloudTrail is a service that enables governance, compliance, operational auditing, and risk auditing of your AWS account. It logs all API calls made to AWS services, including who made the call, when it was made, and what resources were affected. CloudTrail can show exactly which user or role changed S3 bucket settings, when it happened, and what changes were made. This allows you to investigate the strange behavior without restricting user rights. CloudTrail logs can be analyzed using CloudWatch Logs Insights, Athena, or other analytics tools to identify patterns and root causes.""",
            1: """This restricts user rights, which the question explicitly asks to avoid. The requirement is to figure out what's happening without restricting rights. This would prevent investigation by blocking the activity entirely.""",
            2: """This adds security but doesn't help identify who is making changes or why. It also doesn't address the investigation requirement. MFA prevents unauthorized access but doesn't provide audit trails for authorized users.""",
            3: """S3 access logs (server access logs) track object-level access (GET, PUT, DELETE operations on objects), but they don't track bucket-level configuration changes like bucket policies, versioning settings, or lifecycle policies. CloudTrail is needed for API-level auditing of bucket configuration changes."""
        }
    },
    # Continuing with remaining questions 11-65...
    # I'll add them systematically
}

def restructure_all_explanations():
    """Restructure all explanations to the new format"""
    script_dir = os.path.dirname(__file__)
    project_root = os.path.dirname(script_dir) if os.path.basename(script_dir) == 'scripts' else script_dir
    test1_path = os.path.join(project_root, 'questions', 'test1.json')
    
    # Load test1
    with open(test1_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    # Restructure explanations
    updated = 0
    for question in questions:
        q_id = question['id']
        if q_id in EXPLANATIONS:
            exp_data = EXPLANATIONS[q_id]
            correct_ids = exp_data['correct']
            if not isinstance(correct_ids, list):
                correct_ids = [correct_ids]
            exp_dict = exp_data['explanations']
            
            # Build new explanation string
            new_explanation = ""
            
            # Add explanations for correct options (medium-large)
            for correct_id in correct_ids:
                if correct_id in exp_dict:
                    new_explanation += f"**Why option {correct_id} is correct:**\n{exp_dict[correct_id]}\n\n"
            
            # Add explanations for each incorrect option (small-medium)
            for opt in question['options']:
                opt_id = opt['id']
                if opt_id not in correct_ids and opt_id in exp_dict:
                    new_explanation += f"**Why option {opt_id} is incorrect:**\n{exp_dict[opt_id]}\n\n"
            
            question['explanation'] = new_explanation.strip()
            updated += 1
    
    # Save updated file
    with open(test1_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    
    print(f"Restructured explanations for {updated} questions")
    print(f"Total questions: {len(questions)}")
    print(f"Remaining: {len(questions) - updated}")

if __name__ == '__main__':
    restructure_all_explanations()
