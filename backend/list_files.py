import json
import boto3

s3 = boto3.client("s3")

BUCKET = "cloudvault-wisdom"

def lambda_handler(event, context):
    try:
        response = s3.list_objects_v2(Bucket=BUCKET)

        files = []

        if "Contents" in response:
            for obj in response["Contents"]:
                files.append({
                    "filename": obj["Key"],
                    "size": obj["Size"],
                    "last_modified": obj["LastModified"].isoformat()
                })

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps(files)
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e)
            })
        }