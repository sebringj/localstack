import json
import boto3
import hashlib
import os

# LocalStack endpoint
LOCALSTACK_ENDPOINT = os.environ.get('LOCALSTACK_ENDPOINT', 'http://localhost:4566')

dynamodb = boto3.resource('dynamodb', endpoint_url=LOCALSTACK_ENDPOINT, region_name='us-east-1')
users_table = dynamodb.Table('users')

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def handler(event, context):
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    }
    
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
    
    try:
        body = json.loads(event.get('body', '{}'))
        username = body.get('username')
        password = body.get('password')
        
        if not username or not password:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Username and password required'})
            }
        
        # Get user from DynamoDB
        response = users_table.get_item(Key={'username': username})
        user = response.get('Item')
        
        if not user:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Invalid credentials'})
            }
        
        # Check password
        if user['password'] != hash_password(password):
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Invalid credentials'})
            }
        
        # Return simple token (username for demo purposes)
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'token': username,
                'username': username
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }
