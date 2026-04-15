# Contribution Guidelines

Welcome to the ForensicAI project! We appreciate your interest in contributing. Please follow the guidelines below to enhance our collaborative efforts.

## Getting Started

1. **Client Setup**:
   - Clone the repository using `git clone <repository-url>`.
   - Navigate to the client directory: `cd client`.
   - Install dependencies: `npm install`.
   - Start the client: `npm start`.

2. **Server Setup**:
   - Navigate to the server directory: `cd server`.
   - Ensure MongoDB is running on your local machine or connect to a remote instance.
   - Install dependencies: `npm install`.
   - Create a `.env` file for your environment variables, including:
     - `MONGODB_URI` for MongoDB connection
     - `AI_API_KEY` for any AI service keys used in the application
   - Start the server: `npm start`.

## Development Workflow

- Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for commit messages.
- Use feature branches for new developments and keep the `main` branch stable.
- Regularly merge changes from `main` into your feature branch to resolve conflicts early.

## Code Standards

- Follow ES6+ JavaScript/JSX conventions.
- Use CSS variables for consistent theming and styling.
- Design APIs with REST principles; favor meaningful naming and appropriate HTTP status codes.
- Utilize React hooks effectively for state and lifecycle management.

## Testing Procedures

1. **Authentication**: Ensure that user authentication mechanisms are robust and tested.
2. **Case Management**: Test all functionalities that relate to case creation, updates, and retrieval.
3. **Evidence**: Validate the handling and management of evidence submissions.
4. **Reports**: Test different scenarios for generating and viewing reports.
5. **Timeline**: Check the chronological display of events and evidence.

## Security & Legal

- Maintain a clear **chain of custody** for evidence.
- Ensure **evidence integrity** is preserved throughout the lifecycle of case management.
- Follow legal guidelines for **AI labeling** and data handling.
- Adhere to established **forensics standards** at all levels.

## Pull Request Process

- Submit pull requests against the `main` branch.
- Include a clear description of changes and reference any related issues.
- Request reviews from at least two maintainers before merging.
- Ensure that all tests are passing before submitting your PR.

Happy Coding!