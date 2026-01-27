#!/usr/bin/env python3
"""
Elaborate explanations for AWS SAA-C03 exam questions
This script reads JSON question files and generates detailed explanations
"""

import json
import os
import sys

def elaborate_explanation(question):
    """
    Generate an elaborated explanation based on the question and correct answer
    """
    question_text = question['text']
    domain = question.get('domain', '')
    correct_options = []
    incorrect_options = []
    
    # Separate correct and incorrect options
    for opt in question['options']:
        if opt['id'] in question['correctAnswers']:
            correct_options.append(opt)
        else:
            incorrect_options.append(opt)
    
    if not correct_options:
        return question.get('explanation', 'The correct answer is the option marked as correct.')
    
    # Generate explanation based on question content and AWS best practices
    explanation_parts = []
    
    # Start with the correct answer(s)
    if len(correct_options) == 1:
        explanation_parts.append(f"The correct answer is: {correct_options[0]['text']}")
    else:
        correct_texts = [opt['text'] for opt in correct_options]
        explanation_parts.append(f"The correct answers are: {', '.join(correct_texts)}")
    
    # Analyze question keywords to provide context
    question_lower = question_text.lower()
    correct_text_lower = ' '.join([opt['text'].lower() for opt in correct_options])
    
    # IoT and streaming scenarios
    if 'iot' in question_lower or 'streaming' in question_lower or 'real-time' in question_lower:
        if 'kinesis' in correct_text_lower and 'sns' in correct_text_lower:
            explanation_parts.append(
                "\n\nAmazon Kinesis is designed for real-time streaming data processing, making it ideal for IoT data ingestion and analytics. "
                "It can handle high-throughput, real-time data streams and process them for analytics. "
                "Amazon SNS provides push-based notifications to mobile applications, which is exactly what's needed to notify device owners. "
                "This combination allows for real-time data processing followed by immediate notification delivery to mobile apps."
            )
        elif 'sqs' in correct_text_lower:
            explanation_parts.append(
                "\n\nAmazon SQS is a message queuing service, but it's pull-based and not ideal for real-time push notifications to mobile apps. "
                "SNS is better suited for push notifications to mobile applications as it supports mobile push notification services."
            )
        elif 'ses' in correct_text_lower:
            explanation_parts.append(
                "\n\nAmazon SES is for email notifications, not mobile push notifications. "
                "For mobile app notifications, SNS is the appropriate service."
            )
    
    # S3 storage and lifecycle policies
    if 's3' in question_lower and ('lifecycle' in question_lower or 'transition' in question_lower or 'infrequent' in question_lower):
        if 'one zone-ia' in correct_text_lower:
            if '30' in correct_text_lower or 'thirty' in correct_text_lower:
                explanation_parts.append(
                    "\n\nS3 One Zone-IA provides 99.5% availability and stores data in a single Availability Zone, making it less expensive than Standard-IA (about 20% cheaper). "
                    "Since the assets are re-creatable and access frequency drops after the first week, One Zone-IA is cost-effective while maintaining immediate accessibility. "
                    "The 30-day transition period balances cost savings with the requirement for immediate access during the first week of high usage. "
                    "This ensures assets remain in Standard storage during peak access and transition to cheaper storage after demand decreases."
                )
            elif '7' in correct_text_lower or 'seven' in correct_text_lower:
                explanation_parts.append(
                    "\n\nWhile One Zone-IA is cost-effective, transitioning after 7 days may be too early if assets need immediate access during the first week. "
                    "A longer transition period (30 days) better balances cost optimization with accessibility requirements."
                )
        elif 'standard-ia' in correct_text_lower:
            explanation_parts.append(
                "\n\nS3 Standard-IA stores data across multiple Availability Zones, providing higher durability (99.999999999% - 11 9's) but at a higher cost than One Zone-IA. "
                "For re-creatable assets, One Zone-IA offers better cost optimization while still providing immediate access and 99.5% availability."
            )
        elif 'glacier' in correct_text_lower:
            explanation_parts.append(
                "\n\nS3 Glacier storage classes require retrieval time (minutes to hours) and are not suitable for immediately accessible assets. "
                "They're designed for archival data that can tolerate retrieval delays."
            )
    
    # Auto Scaling and EC2
    if 'auto scaling' in question_lower or 'launch template' in question_lower or 'launch configuration' in question_lower:
        if 'launch template' in correct_text_lower and ('only' in correct_text_lower or 'can only' in correct_text_lower):
            explanation_parts.append(
                "\n\nLaunch templates are the recommended and modern way to configure Auto Scaling groups with mixed instance types and purchasing options. "
                "They support both On-Demand and Spot Instances across multiple instance types, allowing for cost optimization while maintaining performance. "
                "Launch configurations are legacy and don't support mixed instance types or Spot Instances with the same flexibility. "
                "You cannot use launch configurations for mixed instance types with Spot Instances - only launch templates support this feature."
            )
        elif 'launch template' in correct_text_lower and 'modify' in question_lower:
            explanation_parts.append(
                "\n\nLaunch templates allow you to update Auto Scaling groups without recreating them, providing a long-term solution. "
                "You can modify the launch template to use the correct instance type, and the Auto Scaling group will use the updated template for new instances. "
                "This is more flexible than launch configurations, which require recreating the Auto Scaling group to change instance types. "
                "Launch configurations are immutable - you must create a new one and update the Auto Scaling group, which is less efficient."
            )
        elif 'launch configuration' in correct_text_lower and 'modify' in question_lower:
            explanation_parts.append(
                "\n\nLaunch configurations are immutable - you cannot modify them directly. "
                "You must create a new launch configuration with the correct instance type, then update the Auto Scaling group to use it. "
                "However, launch templates are the recommended approach as they allow versioning and easier updates."
            )
    
    # S3 cross-region replication and transfer
    if 's3' in question_lower and ('replication' in question_lower or 'copy' in question_lower or 'transfer' in question_lower or 'sync' in question_lower):
        if 'sync' in correct_text_lower:
            explanation_parts.append(
                "\n\nThe AWS CLI 'aws s3 sync' command efficiently copies objects between S3 buckets, including cross-region transfers. "
                "It's ideal for one-time bulk transfers and handles large datasets efficiently. "
                "For petabyte-scale data, it can leverage parallel transfers and retry logic."
            )
        if 'replication' in correct_text_lower:
            explanation_parts.append(
                "\n\nS3 Batch Replication can copy existing objects between buckets in different regions. "
                "After the one-time copy is complete, you can delete the replication configuration. "
                "This is useful for one-time migrations or data transfers."
            )
        if 'transfer acceleration' in correct_text_lower:
            explanation_parts.append(
                "\n\nS3 Transfer Acceleration optimizes transfers from clients to S3, not between S3 buckets. "
                "For bucket-to-bucket transfers, use replication or sync commands."
            )
    
    # CloudWatch and monitoring
    if 'cloudwatch' in correct_text_lower or 'monitoring' in question_lower or 'cpu' in question_lower or 'threshold' in question_lower:
        if 'cloudwatch' in correct_text_lower and 'sns' in correct_text_lower:
            explanation_parts.append(
                "\n\nAmazon CloudWatch monitors EC2 instance metrics like CPU utilization and can trigger alarms when thresholds are breached. "
                "CloudWatch alarms can directly publish to Amazon SNS topics, which can then send email notifications. "
                "This requires minimal development effort - just configure CloudWatch alarms and SNS topics with email subscriptions. "
                "No custom code or Lambda functions are needed for basic monitoring and email notifications."
            )
        elif 'lambda' in correct_text_lower:
            explanation_parts.append(
                "\n\nWhile Lambda can be used, it requires writing code to process CloudWatch events and send emails, which increases development effort. "
                "CloudWatch alarms with SNS provide a simpler, no-code solution for email notifications."
            )
    
    # VPC and networking
    if 'vpc' in question_lower or 'subnet' in question_lower or 'route table' in question_lower or 'internet gateway' in question_lower:
        if 'route table' in correct_text_lower:
            explanation_parts.append(
                "\n\nRoute tables control traffic routing in VPCs. Each subnet must be associated with a route table. "
                "To allow internet access, the route table needs a route to an Internet Gateway (0.0.0.0/0 -> igw-xxx)."
            )
        if 'internet gateway' in correct_text_lower:
            explanation_parts.append(
                "\n\nInternet Gateways enable communication between resources in your VPC and the internet. "
                "They're required for public subnets and must be attached to the VPC and referenced in route tables."
            )
        if 'nat gateway' in correct_text_lower or 'nat instance' in correct_text_lower:
            explanation_parts.append(
                "\n\nNAT Gateways or NAT Instances allow private subnets to access the internet for outbound traffic while remaining private. "
                "They're placed in public subnets and route traffic from private subnets through the Internet Gateway."
            )
    
    # RDS and databases
    if 'rds' in question_lower or 'database' in question_lower or 'aurora' in question_lower:
        if 'multi-az' in correct_text_lower or 'multi-availability' in correct_text_lower:
            explanation_parts.append(
                "\n\nRDS Multi-AZ deployments provide high availability and automatic failover. "
                "The standby replica in another Availability Zone synchronously replicates data and automatically takes over if the primary fails."
            )
        if 'read replica' in correct_text_lower:
            explanation_parts.append(
                "\n\nRead replicas improve read performance by distributing read traffic across multiple database instances. "
                "They can be in the same or different regions and can be promoted to standalone databases if needed."
            )
        if 'snapshot' in correct_text_lower:
            explanation_parts.append(
                "\n\nRDS snapshots are point-in-time backups stored in S3. "
                "They can be used to restore databases, create new instances, or copy databases across regions."
            )
    
    # Lambda and serverless
    if 'lambda' in question_lower or 'serverless' in question_lower:
        if 'lambda' in correct_text_lower:
            explanation_parts.append(
                "\n\nAWS Lambda is a serverless compute service that runs code in response to events. "
                "It automatically scales and manages infrastructure, making it ideal for event-driven architectures."
            )
        if 'event source mapping' in correct_text_lower:
            explanation_parts.append(
                "\n\nLambda event source mappings poll sources like SQS, Kinesis, or DynamoDB streams and invoke Lambda functions. "
                "They handle batching, error handling, and retries automatically."
            )
    
    # IAM and security
    if 'iam' in question_lower or 'policy' in question_lower or 'permission' in question_lower or 'role' in question_lower:
        if 'iam role' in correct_text_lower:
            explanation_parts.append(
                "\n\nIAM roles provide temporary credentials and are the recommended way to grant permissions to AWS services and applications. "
                "They're more secure than access keys as credentials are automatically rotated and don't need to be stored."
            )
        if 'policy' in correct_text_lower:
            explanation_parts.append(
                "\n\nIAM policies define permissions using JSON. They can be attached to users, groups, or roles. "
                "Policies specify what actions are allowed or denied on which resources under what conditions."
            )
    
    # Add domain-specific context
    if 'Design High-Performing Architectures' in domain:
        explanation_parts.append(
            "\n\nThis solution optimizes for performance, scalability, and efficiency, which are key considerations in high-performing architectures."
        )
    elif 'Design Cost-Optimized Architectures' in domain:
        explanation_parts.append(
            "\n\nThis solution provides cost optimization while meeting the performance and availability requirements specified in the scenario."
        )
    elif 'Design Secure Architectures' in domain:
        explanation_parts.append(
            "\n\nThis solution maintains security best practices, proper access controls, and data protection while addressing the functional requirements."
        )
    elif 'Design Resilient Architectures' in domain:
        explanation_parts.append(
            "\n\nThis solution ensures high availability, fault tolerance, and disaster recovery capabilities, which are key aspects of resilient architectures."
        )
    
    # Explain why other options are incorrect (limit to most relevant ones)
    if incorrect_options:
        explanation_parts.append("\n\nWhy other options are incorrect:")
        for opt in incorrect_options[:3]:  # Limit to 3 incorrect options
            opt_text = opt['text']
            opt_lower = opt_text.lower()
            
            # Common incorrect patterns
            if 'sqs' in opt_lower and 'sns' not in opt_lower and 'notification' in question_lower:
                explanation_parts.append(f"\n- {opt_text}: SQS is pull-based and not ideal for push notifications to mobile applications. SNS is designed for push notifications.")
            elif 'ses' in opt_lower and 'mobile' in question_lower:
                explanation_parts.append(f"\n- {opt_text}: SES is for email notifications, not mobile push notifications. Use SNS for mobile notifications.")
            elif 'launch configuration' in opt_lower and 'only' in opt_lower and 'mixed' in question_lower:
                explanation_parts.append(f"\n- {opt_text}: Launch configurations are legacy and don't support mixed instance types with Spot Instances. Only launch templates support this.")
            elif 'standard-ia' in opt_lower and 'one zone-ia' in correct_text_lower and 're-creatable' in question_lower:
                explanation_parts.append(f"\n- {opt_text}: Standard-IA is more expensive than One Zone-IA. For re-creatable assets, One Zone-IA provides better cost optimization.")
            elif 'modify' in opt_lower and 'launch configuration' in opt_lower and 'directly' in opt_lower:
                explanation_parts.append(f"\n- {opt_text}: Launch configurations are immutable and cannot be modified directly. You must create a new one.")
            elif 'lambda' in opt_lower and 'cloudwatch' in question_lower and 'email' in question_lower:
                explanation_parts.append(f"\n- {opt_text}: While Lambda can work, it requires custom code. CloudWatch alarms with SNS provide a simpler, no-code solution.")
            elif 'transfer acceleration' in opt_lower and 'bucket' in question_lower and 'bucket' in question_lower:
                explanation_parts.append(f"\n- {opt_text}: S3 Transfer Acceleration optimizes client-to-S3 transfers, not bucket-to-bucket transfers.")
            elif 'snowball' in opt_lower and 's3' in question_lower and 'region' in question_lower:
                explanation_parts.append(f"\n- {opt_text}: Snowball is for on-premises to AWS transfers, not for S3 bucket-to-bucket transfers within AWS.")
            else:
                explanation_parts.append(f"\n- {opt_text}: This option does not fully address the requirements, introduces unnecessary complexity, or is not the most appropriate solution for this scenario.")
    
    return "".join(explanation_parts)

def process_test_file(test_file_path):
    """Process a single test JSON file"""
    print(f"\nProcessing {test_file_path}...")
    
    with open(test_file_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    updated_count = 0
    for question in questions:
        current_explanation = question.get('explanation', '')
        
        # Skip if explanation is already detailed (more than 400 chars) and doesn't look generic
        # But always process if it's the generic template (short and contains "correct answer is")
        is_generic = (len(current_explanation) < 200 and 
                     ('correct answer' in current_explanation.lower()[:50] or 
                      'option marked as correct' in current_explanation.lower()))
        
        if not is_generic and len(current_explanation) > 400:
            continue
        
        # Generate elaborated explanation
        new_explanation = elaborate_explanation(question)
        
        if new_explanation and new_explanation != current_explanation:
            question['explanation'] = new_explanation
            updated_count += 1
    
    # Write back to file
    with open(test_file_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Updated {updated_count} explanations in {test_file_path}")
    return updated_count

def main():
    """Main function to process all test files"""
    script_dir = os.path.dirname(__file__)
    project_root = os.path.dirname(script_dir) if os.path.basename(script_dir) == 'scripts' else script_dir
    questions_dir = os.path.join(project_root, 'questions')
    
    if not os.path.exists(questions_dir):
        print(f"Error: Questions directory not found: {questions_dir}")
        sys.exit(1)
    
    # Find all test JSON files
    test_files = []
    for filename in sorted(os.listdir(questions_dir)):
        if filename.startswith('test') and filename.endswith('.json'):
            test_files.append(os.path.join(questions_dir, filename))
    
    if not test_files:
        print("No test JSON files found")
        sys.exit(1)
    
    print(f"Found {len(test_files)} test files to process")
    
    total_updated = 0
    for test_file in test_files:
        updated = process_test_file(test_file)
        total_updated += updated
    
    print(f"\n✓ Complete! Updated {total_updated} explanations across {len(test_files)} test files")
    
    # Regenerate questions.js (but preserve elaborated explanations in JSON files)
    print("\nRegenerating questions.js from updated JSON files...")
    import subprocess
    
    # Read all elaborated JSON files and generate questions.js
    all_tests = {}
    for test_file in test_files:
        test_num = int(os.path.basename(test_file).replace('test', '').replace('.json', ''))
        test_key = f'test{test_num}'
        with open(test_file, 'r', encoding='utf-8') as f:
            all_tests[test_key] = json.load(f)
    
    # Generate questions.js
    js_content = """// AWS SAA-C03 Exam Questions
// Auto-generated from JSON files with elaborated explanations

const examQuestions = {
"""
    
    # Sort tests by number
    sorted_tests = sorted(all_tests.items(), key=lambda x: int(x[0].replace('test', '')))
    
    for test_key, questions in sorted_tests:
        js_content += f"    {test_key}: [\n"
        
        for q in questions:
            js_content += "        {\n"
            js_content += f"            id: {q['id']},\n"
            js_content += f"            text: {json.dumps(q['text'], ensure_ascii=False)},\n"
            js_content += "            options: [\n"
            for opt in q['options']:
                js_content += f"                {{ id: {opt['id']}, text: {json.dumps(opt['text'], ensure_ascii=False)}, correct: {str(opt['correct']).lower()} }},\n"
            js_content += "            ],\n"
            js_content += f"            correctAnswers: {q['correctAnswers']},\n"
            js_content += f"            explanation: {json.dumps(q['explanation'], ensure_ascii=False)},\n"
            js_content += f"            domain: {json.dumps(q['domain'], ensure_ascii=False)},\n"
            js_content += "        },\n"
        
        js_content += "    ],\n"
    
    js_content += """};

function getTestQuestions(testNumber) {
    const testKey = `test${testNumber}`;
    return examQuestions[testKey] || [];
}
"""
    
    questions_js_path = os.path.join(project_root, 'questions.js')
    with open(questions_js_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print(f"✓ Successfully regenerated questions.js with {len(all_tests)} tests")

if __name__ == '__main__':
    main()
