// cognitoUserManagement.js — Lambda to manage Cognito users
// Supports: list users, create users, and update user roles via HTTP API Gateway

const { CognitoIdentityProviderClient, ListUsersCommand, AdminCreateUserCommand, AdminUpdateUserAttributesCommand } = require("@aws-sdk/client-cognito-identity-provider");

// === Cognito Setup ===
// If you need to switch regions or use a custom endpoint for Cognito, adjust the constructor below.
const cognitoClient = new CognitoIdentityProviderClient({});

// Ensure your Lambda function has this environment variable set.
const USER_POOL_ID = process.env.USER_POOL_ID;

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  const httpMethod = event.requestContext?.http?.method;
  const path = event.rawPath;
  console.log(`Processing request: ${httpMethod} ${path}`);

  let body = {};
  if (event.body) {
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch (error) {
      return httpResponse(400, { message: 'Invalid JSON body' });
    }
  }

  try {
    // === GET /users — List all users in Cognito user pool ===
    if (httpMethod === 'GET' && path === '/users') {
      return await listUsers();
    }

    // === POST /users — Create new user with role ===
    if (httpMethod === 'POST' && path === '/users') {
      if (!body.email || !body.role) {
        return httpResponse(400, { message: 'Missing "email" or "role"' });
      }
      return await createUser(body.email, body.role);
    }

    // === PUT /users/{username}/role — Update existing user's custom:role ===
    if (httpMethod === 'PUT' && path.match(/^\/users\/[^\/]+\/role$/)) {
      const username = path.split('/')[2];
      if (!body.role) return httpResponse(400, { message: 'Missing "role"' });
      return await updateUserRole(username, body.role);
    }

    return httpResponse(404, { message: 'Not Found', requestPath: path, requestMethod: httpMethod });

  } catch (error) {
    console.error('Error:', error);
    return httpResponse(500, { message: 'Internal Server Error', error: error.message });
  }
};

// === LIST USERS ===
// If user data grows, consider paginating with ListUsersCommand's PaginationToken.
async function listUsers() {
  const params = { UserPoolId: USER_POOL_ID };
  try {
    const command = new ListUsersCommand(params);
    const res = await cognitoClient.send(command);
    return httpResponse(200, { users: res.Users });
  } catch (error) {
    return httpResponse(500, { message: 'Error listing users', error: error.message });
  }
}

// === CREATE USER ===
// Default temporary password is hardcoded. Update this if your policy or compliance rules require secure password delivery via email or SMS.
// Also, if you want Cognito to send welcome emails, remove the MessageAction: 'SUPPRESS' option.
async function createUser(email, role) {
  const params = {
    UserPoolId: USER_POOL_ID,
    Username: email,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'custom:role', Value: role },
    ],
    TemporaryPassword: 'TempPassword123!',
    MessageAction: 'SUPPRESS',
  };

  try {
    const command = new AdminCreateUserCommand(params);
    const res = await cognitoClient.send(command);
    return httpResponse(201, { message: 'User created', user: res.User });
  } catch (error) {
    return httpResponse(500, { message: 'Error creating user', error: error.message });
  }
}

// === UPDATE USER ROLE ===
// If you expand user metadata beyond role (e.g., department, team), modify this function and Cognito attributes accordingly.
async function updateUserRole(username, role) {
  const params = {
    UserPoolId: USER_POOL_ID,
    Username: username,
    UserAttributes: [
      { Name: 'custom:role', Value: role },
    ],
  };

  try {
    const command = new AdminUpdateUserAttributesCommand(params);
    await cognitoClient.send(command);
    return httpResponse(200, { message: 'User role updated', username, role });
  } catch (error) {
    return httpResponse(500, { message: 'Error updating user role', error: error.message });
  }
}

// === Shared Response Helper ===
function httpResponse(code, payload) {
  return {
    statusCode: code,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(payload)
  };
}
