#!/usr/bin/env python3
"""
Fix all questions with grouped explanations by separating them per option.
Maps each option to its specific explanation from the original source.
"""

import json
import os
import re

# Map of question_id -> {option_id: specific_explanation}
SPECIFIC_EXPLANATIONS = {
    15: {
        0: "Standard RDS for Oracle doesn't allow customization of the database environment or underlying OS. Read replicas provide read scaling but don't allow the level of customization required. Standard RDS is a managed service with limited OS and database customization.",
        2: "While this allows full customization, it requires managing the database yourself, including backups, patching, and high availability setup. This increases operational overhead compared to RDS Custom, which provides managed services with customization capabilities.",
        3: "Standard RDS for Oracle doesn't allow customization of the database environment or underlying operating system. The requirement specifically needs customization capabilities that standard RDS doesn't provide."
    },
    16: {
        0: "Redshift is a data warehouse designed for analytical queries on large datasets, not for transactional read/write operations. It's not suitable for real-time game data retrieval. Redshift has higher latency and is optimized for complex analytical queries, not simple lookups.",
        1: "Lambda is a compute service and doesn't address the database read performance issue. The problem is database load, not compute performance. Lambda would still need to query the same RDS database, so it doesn't solve the problem.",
        3: "While read replicas can help distribute read traffic, they don't reduce costs - you're adding more database instances, which increases costs. Read replicas also don't reduce latency as much as caching does. ElastiCache provides better performance improvement and cost reduction."
    },
    22: {
        0: "VPN connections have bandwidth limitations and would take an extremely long time to transfer 5PB. VPN is also not cost-effective for such large transfers. Like Direct Connect, you cannot directly write to Glacier.",
        1: "Direct Connect has high setup costs and monthly fees. For a one-time migration of 5PB, the cost would be prohibitive. Direct Connect is designed for ongoing connectivity, not one-time bulk transfers. Also, you cannot directly write to Glacier - data must go to S3 first, then transition to Glacier.",
        3: "Snowball devices import data into S3, not directly into Glacier. You must first import to S3, then use lifecycle policies or other methods to transition to Glacier. Glacier doesn't support direct imports from Snowball."
    },
    36: {
        1: "Shield Advanced doesn't support Savings Plans. Savings Plans are for compute services (EC2, Lambda, Fargate), not security services like Shield Advanced.",
        2: "Shield Advanced only protects AWS resources (CloudFront, ELB, Route 53, EC2, etc.). It cannot protect on-premises or non-AWS infrastructure. This wouldn't cause unexpected costs.",
        3: "Shield Advanced includes Shield Standard features, but this doesn't cause increased costs. Shield Standard is free, and Shield Advanced replaces it, not adds to it."
    },
    37: {
        0: "Gateway endpoints are VPC endpoints for S3 and DynamoDB - they don't provide throttling. They're for private connectivity, not traffic management.",
        1: "SNS doesn't provide throttling or buffering - it's a pub/sub messaging service. Lambda can be throttled but doesn't throttle incoming requests. This combination doesn't provide the throttling capabilities needed.",
        2: "ELB distributes traffic but doesn't throttle it. ELB can handle high traffic but doesn't prevent spikes from reaching backend services. API Gateway provides better throttling capabilities."
    },
    38: {
        0: "OpenSearch (formerly Elasticsearch) is a search and analytics engine, not a graph database. It's good for full-text search and log analytics but not optimized for relationship traversal queries like 'friends of friends.'",
        1: "Aurora is a relational database optimized for SQL queries. While it can handle complex queries with JOINs, graph databases like Neptune are specifically designed for relationship-heavy queries and perform much better for social network-style queries.",
        3: "Redshift is a data warehouse for analytical queries on large datasets. It's not designed for transactional queries or relationship traversal. It's optimized for aggregations and analytical workloads, not graph queries."
    },
    41: {
        0: "Glue is an ETL (Extract, Transform, Load) service for data preparation and transformation. It's not a file system and doesn't provide the high-performance file access needed for EDA applications. Glue is for data processing pipelines, not file storage.",
        1: "EMR is a managed Hadoop/Spark cluster service for big data processing. While it can handle large datasets, it's not optimized for the high-performance file access patterns of EDA applications. EMR is for distributed data processing, not file system performance.",
        3: "FSx for Windows is designed for Windows-based file shares and Active Directory integration. It's not optimized for high-performance compute workloads like EDA. Lustre is specifically designed for HPC and compute-intensive applications."
    },
    45: {
        0: "While query results stay in-region (free), accessing the tool over the internet has higher costs than Direct Connect for the web page transfers.",
        2: "This would transfer 60MB query results over Direct Connect for each query, which incurs data transfer costs. The visualization tool in AWS with same-region queries avoids this cost.",
        3: "Internet egress from AWS has higher costs than Direct Connect. Transferring 60MB query results over the internet would be more expensive."
    },
    64: {
        0: "SQS doesn't provide the same real-time streaming capabilities as Kinesis. SQS is pull-based and doesn't support multiple consumers reading the same data stream efficiently. Kinesis is designed for streaming analytics.",
        1: "Similar to standard queues, FIFO queues don't provide streaming data capabilities. They're for message queuing, not real-time data streams. FIFO queues also have lower throughput limits.",
        3: "Firehose is for loading streaming data into destinations (S3, Redshift, etc.), not for multiple consumer applications. It doesn't support the multiple consumer pattern that Kinesis Data Streams provides."
    }
}

def fix_question(question):
    """Fix a single question's explanations"""
    q_id = question['id']
    if q_id not in SPECIFIC_EXPLANATIONS:
        return question['explanation']  # No fix needed
    
    exp = question['explanation']
    fixes = SPECIFIC_EXPLANATIONS[q_id]
    
    # Replace each option's explanation
    for opt_id, new_exp in fixes.items():
        # Find and replace the explanation for this option
        pattern = rf'\*\*Why option {opt_id} is incorrect:\*\*\n.*?(?=\n\n\*\*Why option|\Z)'
        replacement = f"**Why option {opt_id} is incorrect:**\n{new_exp}"
        exp = re.sub(pattern, replacement, exp, flags=re.DOTALL)
    
    return exp

def update_test1():
    """Update test1.json"""
    script_dir = os.path.dirname(__file__)
    project_root = os.path.dirname(script_dir) if os.path.basename(script_dir) == 'scripts' else script_dir
    test1_path = os.path.join(project_root, 'questions', 'test1.json')
    
    with open(test1_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    updated = 0
    for question in questions:
        old_explanation = question.get('explanation', '')
        new_explanation = fix_question(question)
        
        if new_explanation != old_explanation:
            question['explanation'] = new_explanation
            updated += 1
    
    with open(test1_path, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)
    
    print(f"Fixed {updated} questions with grouped explanations")
    print(f"Total questions: {len(questions)}")

if __name__ == '__main__':
    update_test1()
