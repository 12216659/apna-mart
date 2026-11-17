import AuthForm from './AuthForm';

export default function LoginScreen(props) {
  return <AuthForm {...props} isRegistering={false} />;
}
