#!/usr/bin/env python3
"""
Fix first 5 questions to have properly separated explanations:
- One explanation per option
- No bullet points
- No grouped explanations
- Each explanation as a single paragraph
"""

import json
import os

# Properly separated explanations for questions 1-5
FIXED_EXPLANATIONS = {
    1: """**Why option 2 is correct:**
Amazon Kinesis Data Streams is specifically designed for real-time streaming data ingestion and processing. It can handle high-throughput IoT data streams and perform real-time analytics using Kinesis Data Analytics or Lambda functions. Kinesis provides low-latency data processing capabilities that are essential for IoT applications where data needs to be analyzed in real-time. Once analytics are complete, Amazon SNS is the ideal service for push notifications to mobile applications. SNS supports mobile push notification services including APNS (Apple Push Notification Service) for iOS devices and FCM (Firebase Cloud Messaging) for Android devices. SNS can deliver messages directly to mobile apps without requiring the apps to poll for updates, which is more efficient and battery-friendly. This combination of Kinesis for real-time streaming analytics and SNS for mobile push notifications provides a complete, scalable solution for IoT data processing and notification delivery.

**Why option 0 is incorrect:**
Amazon SQS is a message queuing service designed for decoupling applications, but it's pull-based (applications poll for messages) and doesn't provide the real-time streaming capabilities required for IoT data processing. While SQS can work with SNS, using SQS adds unnecessary complexity and latency. Kinesis is purpose-built for real-time streaming analytics with low latency, making it the better choice for processing IoT data streams.

**Why option 1 is incorrect:**
Amazon SES (Simple Email Service) is designed for sending email notifications, not push notifications to mobile applications. The requirement specifically asks for notifications to mobile apps, which requires SNS with mobile push support. SES cannot deliver push notifications to mobile devices - it only sends emails.

**Why option 3 is incorrect:**
Amazon SQS is pull-based and not designed for push notifications. Mobile applications would need to continuously poll SQS to check for new messages, which is inefficient, increases latency, and drains device battery. SNS provides true push notifications where AWS delivers messages directly to the mobile app without requiring polling.""",

    2: """**Why option 2 is correct:**
S3 One Zone-IA stores data in a single Availability Zone, providing 99.5% availability at approximately 20% lower cost than S3 Standard-IA. Since the assets are re-creatable (can be regenerated if lost), the reduced durability of One Zone-IA is acceptable. The 30-day transition period ensures assets remain in Standard storage during the first week of high access, then transition to cheaper storage after access frequency drops. This balances cost optimization with the requirement for immediate accessibility.

**Why option 0 is incorrect:**
Transitioning to S3 One Zone-IA after 7 days is too early. The scenario states assets are accessed frequently for the first few days, and transitioning too early could impact performance or increase costs if assets are still being accessed frequently. The 30-day period ensures the high-access period has passed before transitioning to cheaper storage.

**Why option 1 is incorrect:**
S3 Standard-IA stores data across multiple Availability Zones providing 99.999999999% durability (11 9's), which is overkill for re-creatable assets. It's also more expensive than One Zone-IA. Additionally, the 7-day transition is too early, potentially impacting performance during high-access periods when assets are still being frequently accessed.

**Why option 3 is incorrect:**
While the 30-day timing is correct, S3 Standard-IA is more expensive than One Zone-IA. For re-creatable assets that don't require maximum durability, One Zone-IA provides the best cost optimization while maintaining immediate accessibility. Standard-IA's multi-AZ durability is unnecessary for data that can be regenerated.""",

    3: """**Why option 0 is correct:**
Launch templates are the modern, recommended way to configure Auto Scaling groups. They support mixed instance types and mixed purchasing options (On-Demand and Spot Instances) through the Mixed Instances Policy feature. This allows you to specify multiple instance types and purchasing strategies, enabling cost optimization while maintaining performance. Launch templates also support versioning and can be updated without recreating the Auto Scaling group.

**Why option 1 is incorrect:**
This is incorrect because launch templates DO support mixed instance types with Spot Instances through Mixed Instances Policy. This feature was specifically designed for this use case and allows you to provision capacity across multiple instance types using both On-Demand and Spot Instances.

**Why option 2 is incorrect:**
Launch configurations are legacy and do NOT support mixed instance types or Spot Instances. They only support a single instance type and On-Demand instances. This option is incorrect because it suggests launch configurations can do something they cannot. Only launch templates support the Mixed Instances Policy feature.

**Why option 3 is incorrect:**
Launch configurations cannot support mixed instance types or Spot Instances. They are limited to a single instance type and On-Demand purchasing only. This is a fundamental limitation of launch configurations. Only launch templates support mixed instance types and purchasing options.""",

    4: """**Why option 1 is correct:**
Launch configurations are immutable - they cannot be modified once created. To fix an incorrect instance type, you must create a new launch configuration with the correct instance type, then update the Auto Scaling group to use the new launch configuration. The old launch configuration can be deleted once the Auto Scaling group is updated. New instances launched by the Auto Scaling group will use the correct instance type from the new launch configuration. Existing instances will continue running with the old instance type until they are terminated and replaced.

**Why option 0 is incorrect:**
Auto Scaling groups don't have a direct instance type setting - they get this from the launch configuration. You cannot change the instance type without changing the launch configuration. The Auto Scaling group references a launch configuration, which defines the instance type. Simply modifying the Auto Scaling group won't change the instance type.

**Why option 2 is incorrect:**
Adding more instances of the wrong type doesn't solve the performance problem. The issue is that the instance type itself is incorrect and not optimized for the application workflow, not the quantity. More instances of the wrong type won't improve performance - you need the correct instance type that matches the application's requirements.

**Why option 3 is incorrect:**
Launch configurations are immutable and cannot be modified after creation. This is a fundamental characteristic of launch configurations. You must create a new launch configuration with the correct instance type rather than trying to modify an existing one.""",

    5: """**Why option 0 is correct:**
AWS CLI aws s3 sync command efficiently copies objects between S3 buckets, including cross-region transfers. It's ideal for one-time bulk transfers and handles large datasets (like 1 petabyte) efficiently with parallel transfers and retry logic. The sync command automatically handles differences between buckets and can resume interrupted transfers. It's a straightforward solution for one-time copies and can be run from any machine with AWS CLI access.

**Why option 2 is correct:**
S3 batch replication can copy existing objects (not just new ones) when configured with batch replication. After setting up replication and allowing it to copy existing objects, you can delete the replication configuration once the one-time copy is complete. This provides a managed, console-based solution that handles the transfer automatically without requiring command-line tools or manual intervention.

**Why option 1 is incorrect:**
S3 Transfer Acceleration optimizes transfers from clients (like on-premises) to S3 using CloudFront edge locations. It does NOT help with bucket-to-bucket transfers within AWS. For bucket-to-bucket transfers, you should use sync or replication. Transfer Acceleration is designed for client-to-S3 transfers, not S3-to-S3 transfers.

**Why option 3 is incorrect:**
Snowball is for transferring data from on-premises to AWS, not for S3 bucket-to-bucket transfers within AWS. The data is already in S3, so Snowball is not applicable. Snowball is used when you need to physically ship data from on-premises locations, not for cloud-to-cloud transfers between S3 buckets.

**Why option 4 is incorrect:**
While you can copy individual objects in the S3 console, copying 1 petabyte through the console UI is not practical. The console is designed for small-scale operations, not bulk transfers. This would require thousands of manual operations and is not feasible for such a large dataset."""
}

def update_first_5():
    """Update first 5 questions in test1.json"""
    script_dir = os.path.dirname(__file__)
    project_root = os.path.dirname(script_dir) if os.path.basename(script_dir) == 'scripts' else script_dir
    test1_path = os.path.join(project_root, 'questions', 'test1.json')
    
    with open(test1_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    updated = 0
    for question in questions:
        q_id = question['id']
        if q_id in FIXED_EXPLANATIONS:
            question['explanation'] = FIXED_EXPLANATIONS[q_id]
            updated += 1
    
    with open(test1_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Updated {updated} questions (Q1-Q5) with properly separated explanations")
    print("  Each option now has its own dedicated explanation")
    print("  No bullet points or grouped explanations")

if __name__ == '__main__':
    update_first_5()
