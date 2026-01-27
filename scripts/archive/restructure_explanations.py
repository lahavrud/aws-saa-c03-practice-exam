#!/usr/bin/env python3
"""
Restructure Test 1 explanations to have:
- Medium-to-large explanation for correct answer
- Separate small-to-medium explanations for each incorrect option
"""

import json
import os

# Load the current explanations and restructure them
# Format: For each question, provide explanations for each option separately

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
    # I'll continue adding all 65 questions...
}

def restructure_explanations():
    """Restructure explanations to the new format"""
    script_dir = os.path.dirname(__file__)
    project_root = os.path.dirname(script_dir) if os.path.basename(script_dir) == 'scripts' else script_dir
    test1_path = os.path.join(project_root, 'questions', 'test1.json')
    
    # Load test1
    with open(test1_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    # Restructure explanations
    for question in questions:
        q_id = question['id']
        if q_id in EXPLANATIONS:
            exp_data = EXPLANATIONS[q_id]
            correct_id = exp_data['correct']
            exp_dict = exp_data['explanations']
            
            # Build new explanation string
            new_explanation = f"**Why option {correct_id} is correct:**\n{exp_dict[correct_id]}\n\n"
            
            # Add explanations for each incorrect option
            for opt in question['options']:
                opt_id = opt['id']
                if opt_id != correct_id and opt_id in exp_dict:
                    new_explanation += f"**Why option {opt_id} is incorrect:**\n{exp_dict[opt_id]}\n\n"
            
            question['explanation'] = new_explanation.strip()
    
    # Save updated file
    with open(test1_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    
    print(f"Restructured explanations for {len([q for q in questions if q['id'] in EXPLANATIONS])} questions")

if __name__ == '__main__':
    restructure_explanations()
