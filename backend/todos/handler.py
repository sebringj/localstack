import json
import boto3
import uuid
import os
from datetime import datetime

# LocalStack endpoint
LOCALSTACK_ENDPOINT = os.environ.get('LOCALSTACK_ENDPOINT', 'http://localhost:4566')

dynamodb = boto3.resource('dynamodb', endpoint_url=LOCALSTACK_ENDPOINT, region_name='us-east-1')
todos_table = dynamodb.Table('todos')

def get_headers():
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE'
    }

def get_user_from_token(event):
    """Extract username from Authorization header (simple token)"""
    headers = event.get('headers', {}) or {}
    auth = headers.get('Authorization') or headers.get('authorization', '')
    if auth.startswith('Bearer '):
        return auth[7:]
    return auth

def handler(event, context):
    headers = get_headers()
    
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
    
    method = event.get('httpMethod', 'GET')
    path = event.get('path', '')
    path_params = event.get('pathParameters') or {}
    
    username = get_user_from_token(event)
    if not username:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    try:
        if method == 'GET':
            return list_todos(username, headers)
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            return create_todo(username, body, headers)
        elif method == 'PUT':
            todo_id = path_params.get('id')
            body = json.loads(event.get('body', '{}'))
            return update_todo(username, todo_id, body, headers)
        elif method == 'DELETE':
            todo_id = path_params.get('id')
            return delete_todo(username, todo_id, headers)
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'})
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def list_todos(username, headers):
    """List all todos for a user"""
    response = todos_table.query(
        KeyConditionExpression=boto3.dynamodb.conditions.Key('username').eq(username)
    )
    todos = response.get('Items', [])
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'todos': todos})
    }

def create_todo(username, body, headers):
    """Create a new todo"""
    todo_id = str(uuid.uuid4())
    todo = {
        'username': username,
        'todo_id': todo_id,
        'title': body.get('title', ''),
        'completed': False,
        'created_at': datetime.utcnow().isoformat()
    }
    todos_table.put_item(Item=todo)
    return {
        'statusCode': 201,
        'headers': headers,
        'body': json.dumps({'todo': todo})
    }

def update_todo(username, todo_id, body, headers):
    """Update a todo"""
    update_expression = 'SET '
    expression_values = {}
    expression_names = {}
    
    if 'title' in body:
        update_expression += '#title = :title, '
        expression_values[':title'] = body['title']
        expression_names['#title'] = 'title'
    
    if 'completed' in body:
        update_expression += 'completed = :completed, '
        expression_values[':completed'] = body['completed']
    
    update_expression = update_expression.rstrip(', ')
    
    if not expression_values:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'No fields to update'})
        }
    
    update_kwargs = {
        'Key': {'username': username, 'todo_id': todo_id},
        'UpdateExpression': update_expression,
        'ExpressionAttributeValues': expression_values,
        'ReturnValues': 'ALL_NEW'
    }
    
    if expression_names:
        update_kwargs['ExpressionAttributeNames'] = expression_names
    
    response = todos_table.update_item(**update_kwargs)
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'todo': response.get('Attributes', {})})
    }

def delete_todo(username, todo_id, headers):
    """Delete a todo"""
    todos_table.delete_item(Key={'username': username, 'todo_id': todo_id})
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({'message': 'Todo deleted'})
    }
