import { Controller, Get, Post, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiTooManyRequestsResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Create a new user account with email and password. Returns access and refresh tokens.',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    schema: {
      example: {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'customer@example.com',
          role: 'customer',
          firstName: 'John',
          lastName: 'Doe',
        },
        tokens: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid input or user already exists' })
  @ApiTooManyRequestsResponse({ description: 'Too many registration attempts' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 login attempts per minute
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticate user with email and password. Returns access and refresh tokens.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'customer@example.com',
          role: 'customer',
        },
        tokens: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiTooManyRequestsResponse({ description: 'Too many login attempts' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 refreshes per minute
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get a new access token using a valid refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token' })
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 attempts per 5 minutes
  @ApiOperation({
    summary: 'Verify email address',
    description: 'Verify user email with token sent to email address',
  })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiBadRequestResponse({ description: 'Invalid or expired verification token' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 attempts per 5 minutes
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Send password reset email to user',
  })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 attempts per 5 minutes
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset user password with reset token',
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiBadRequestResponse({ description: 'Invalid or expired reset token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Logout user',
    description: 'Invalidate refresh token and logout user',
  })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async logout(@Req() req: any, @Body() body: { refreshToken: string }) {
    return this.authService.logout(req.user.sub, body.refreshToken);
  }

  @Get('session')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user session',
    description: 'Returns current authenticated user details',
  })
  @ApiResponse({
    status: 200,
    description: 'Session details',
    schema: {
      example: {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'customer@example.com',
          role: 'customer',
          isVerified: true,
          profile: {
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567890',
            avatarUrl: null,
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing JWT token' })
  async getSession(@Req() req: any) {
    return this.authService.getSession(req.user.sub);
  }
}
