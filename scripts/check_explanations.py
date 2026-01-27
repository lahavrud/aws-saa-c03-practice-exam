#!/usr/bin/env python3
import json
import os

total_needing_fix = 0
for i in range(11, 27):
    f = f'questions/test{i}.json'
    if os.path.exists(f):
        try:
            data = json.load(open(f))
            remaining = []
            for j, q in enumerate(data):
                exp = q.get('explanation', '')
                if 'Explanation not available' in exp or len(exp) < 200 or ('Why other options are incorrect' in exp and exp.count('**Why option') < 5):
                    remaining.append(j)
            total_needing_fix += len(remaining)
            print(f'{os.path.basename(f)}: {len(remaining)}/{len(data)} need fixes')
        except Exception as e:
            print(f'{os.path.basename(f)}: Error - {e}')

print(f'\nTotal questions needing fixes: {total_needing_fix}')
