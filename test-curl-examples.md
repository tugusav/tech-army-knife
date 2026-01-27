# Testing cURL Command Parsing

Here are some example cURL commands you can use to test the parsing functionality:

## How to Test:
1. Go to the cURL Generator tool
2. Click on the "Import" tab
3. Paste one of the examples below into the textarea
4. Click "Import cURL" button
5. Check that the URL, method, headers, and body are populated correctly in the other tabs

## Test Examples:

### 1. Simple GET Request
```bash
curl -X GET 'https://jsonplaceholder.typicode.com/posts/1'
```
**Expected Result:**
- Method: GET
- URL: https://jsonplaceholder.typicode.com/posts/1

### 2. POST with JSON Data
```bash
curl -X POST 'https://jsonplaceholder.typicode.com/posts' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer token123' \
  -d '{"title": "foo", "body": "bar", "userId": 1}'
```
**Expected Result:**
- Method: POST
- URL: https://jsonplaceholder.typicode.com/posts
- Headers: Content-Type: application/json, Authorization: Bearer token123
- Body: {"title": "foo", "body": "bar", "userId": 1}

### 3. GET with Query Parameters
```bash
curl -X GET 'https://api.example.com/search?q=javascript&limit=10&sort=date'
```
**Expected Result:**
- Method: GET
- URL: https://api.example.com/search
- Query Params: q=javascript, limit=10, sort=date

### 4. Complex POST with Multiple Headers
```bash
curl -X POST 'https://api.example.com/users' \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: abc123' \
  -H 'User-Agent: MyApp/1.0' \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```
**Expected Result:**
- Method: POST
- URL: https://api.example.com/users
- Headers: Content-Type: application/json, X-API-Key: abc123, User-Agent: MyApp/1.0
- Body: {"name": "John Doe", "email": "john@example.com"}

### 5. Single Line Format (no backslashes)
```bash
curl -X POST 'https://httpbin.org/post' -H 'Content-Type: application/json' -d '{"test": "data"}'
```

### 6. With Various Flags
```bash
curl -X GET 'https://httpbin.org/get' -H 'Accept: application/json' -v -k
```

## Troubleshooting:

If parsing doesn't work:
1. **Check the format**: Make sure the cURL command is properly formatted
2. **Check quotes**: Ensure headers and data are properly quoted
3. **Check the URL**: URL should be complete with protocol (http:// or https://)
4. **Check the console**: Open browser dev tools to see any error messages
5. **Try the examples**: Use the built-in example buttons in the Import tab

## What Gets Parsed:
- ✅ URL (with query parameters)
- ✅ HTTP Method (-X or --request)
- ✅ Headers (-H or --header)
- ✅ Request Body (-d, --data, --data-raw)
- ✅ Quoted strings with spaces
- ✅ Multi-line commands with backslashes
- ❌ Form data (-F) - not yet implemented in parser
- ❌ File uploads (@filename) - not yet implemented in parser
- ❌ Authentication flags (-u) - not yet implemented in parser