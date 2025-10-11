'use client';

import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from '../../hooks';
import { getErrorMessage } from '../../utils';
import { FormHead } from '../../components/form-head';
import { signinInitiate, signinPassword, signinVerifyDevice } from '../../context/jwt';

// ----------------------------------------------------------------------

export type SignInSchemaType = zod.infer<typeof SignInSchema>;

export const SignInSchema = zod.object({
  email: zod
    .string()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' }),
  password: zod
    .string()
    .min(1, { message: 'Password is required!' })
    .min(6, { message: 'Password must be at least 6 characters!' }),
});

export type VerifyCodeSchemaType = zod.infer<typeof VerifyCodeSchema>;

export const VerifyCodeSchema = zod.object({
  code: zod
    .string()
    .min(1, { message: 'Verification code is required!' })
    .min(6, { message: 'Code must be at least 6 characters!' }),
});

// ----------------------------------------------------------------------

type AuthStep = 'signin' | 'verify-device';

export function JwtSignInView() {
  const router = useRouter();

  const showPassword = useBoolean();

  const { checkUserSession } = useAuthContext();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState<AuthStep>('signin');
  const [sessionToken, setSessionToken] = useState<string>('');

  const defaultValues: SignInSchemaType = {
    email: 'admin@example.com',
    password: 'AdminPass123!',
  };

  const methods = useForm<SignInSchemaType>({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const verifyMethods = useForm<VerifyCodeSchemaType>({
    resolver: zodResolver(VerifyCodeSchema),
    defaultValues: { code: '' },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    getValues,
  } = methods;

  const {
    handleSubmit: handleVerifySubmit,
    formState: { isSubmitting: isVerifySubmitting },
  } = verifyMethods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      setErrorMessage(null);

      // Step 1: Initiate sign-in
      const initiateRes = await signinInitiate(data.email);

      // Check the next step from the response
      if (initiateRes.data.nextStep === 'password') {
        // Step 2: Enter password
        const passwordRes = await signinPassword(
          initiateRes.data.sessionToken,
          data.password
        );

        // Check if device verification is required
        if (passwordRes.data.requiresDeviceVerification && passwordRes.data.sessionToken) {
          setSessionToken(passwordRes.data.sessionToken);
          setAuthStep('verify-device');
          return;
        }

        // If no device verification needed, we're done
        await checkUserSession?.();
        router.refresh();
      } else if (initiateRes.data.nextStep === 'sms_code') {
        // Phone-based signin with SMS code
        setSessionToken(initiateRes.data.sessionToken);
        setAuthStep('verify-device');
      }
    } catch (error) {
      console.error(error);
      const feedbackMessage = getErrorMessage(error);
      setErrorMessage(feedbackMessage);
    }
  });

  const onVerifySubmit = handleVerifySubmit(async (data) => {
    try {
      setErrorMessage(null);

      // Step 3: Verify device with code
      await signinVerifyDevice(sessionToken, data.code);

      await checkUserSession?.();
      router.refresh();
    } catch (error) {
      console.error(error);
      const feedbackMessage = getErrorMessage(error);
      setErrorMessage(feedbackMessage);
    }
  });

  const handleBackToSignIn = () => {
    setAuthStep('signin');
    setSessionToken('');
    setErrorMessage(null);
    verifyMethods.reset();
  };

  const renderSignInForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Field.Text name="email" label="Email address" slotProps={{ inputLabel: { shrink: true } }} />

      <Box sx={{ gap: 1.5, display: 'flex', flexDirection: 'column' }}>
        <Link
          component={RouterLink}
          href={paths.auth.jwt.resetPassword}
          variant="body2"
          color="inherit"
          sx={{ alignSelf: 'flex-end' }}
        >
          Forgot password?
        </Link>

        <Field.Text
          name="password"
          label="Password"
          placeholder="6+ characters"
          type={showPassword.value ? 'text' : 'password'}
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={showPassword.onToggle} edge="end">
                    <Iconify
                      icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Button
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Signing in..."
      >
        Sign in
      </Button>
    </Box>
  );

  const renderVerifyForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Alert severity="info">
        A verification code has been sent to your email/phone. Please enter it below to complete
        sign-in.
      </Alert>

      <Field.Text
        name="code"
        label="Verification Code"
        placeholder="Enter 6-digit code"
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <Box sx={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
        <Button
          fullWidth
          color="inherit"
          size="large"
          type="submit"
          variant="contained"
          loading={isVerifySubmitting}
          loadingIndicator="Verifying..."
        >
          Verify & Sign in
        </Button>

        <Button
          fullWidth
          color="inherit"
          size="large"
          variant="outlined"
          onClick={handleBackToSignIn}
          disabled={isVerifySubmitting}
        >
          Back to Sign In
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      <FormHead
        title={authStep === 'signin' ? 'Sign in to your account' : 'Verify your device'}
        description={
          authStep === 'verify-device'
            ? `We sent a verification code to ${getValues('email')}`
            : undefined
        }
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {authStep === 'signin' ? (
        <Form methods={methods} onSubmit={onSubmit}>
          {renderSignInForm()}
        </Form>
      ) : (
        <Form methods={verifyMethods} onSubmit={onVerifySubmit}>
          {renderVerifyForm()}
        </Form>
      )}
    </>
  );
}
