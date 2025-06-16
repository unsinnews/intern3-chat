import { Body, Container, Head, Html, Link, Preview, Section, Text } from "@react-email/components"

interface EmailVerificationTemplateProps {
    name?: string
    verificationUrl: string
}

export const EmailVerificationTemplate = ({
    name,
    verificationUrl
}: EmailVerificationTemplateProps) => (
    <Html>
        <Head />
        <Preview>Verify your email address for Intern3 Chat</Preview>
        <Body style={main}>
            <Container style={container}>
                <Section>
                    <Text style={heading}>Verify your email address</Text>
                    <Text style={text}>{name ? `Hi ${name},` : "Hi,"}</Text>
                    <Text style={text}>
                        Thank you for signing up for Intern3 Chat. To complete your registration,
                        please verify your email address by clicking the link below:
                    </Text>
                    <Link href={verificationUrl} style={button}>
                        Verify Email Address
                    </Link>
                    <Text style={text}>
                        If you didn't create an account, you can safely ignore this email.
                    </Text>
                    <Text style={footer}>
                        This link will expire in 24 hours for security reasons.
                    </Text>
                </Section>
            </Container>
        </Body>
    </Html>
)

interface PasswordResetTemplateProps {
    name?: string
    resetUrl: string
}

export const PasswordResetTemplate = ({ name, resetUrl }: PasswordResetTemplateProps) => (
    <Html>
        <Head />
        <Preview>Reset your password for Intern3 Chat</Preview>
        <Body style={main}>
            <Container style={container}>
                <Section>
                    <Text style={heading}>Reset your password</Text>
                    <Text style={text}>{name ? `Hi ${name},` : "Hi,"}</Text>
                    <Text style={text}>
                        We received a request to reset your password for your Intern3 Chat account.
                        Click the link below to create a new password:
                    </Text>
                    <Link href={resetUrl} style={button}>
                        Reset Password
                    </Link>
                    <Text style={text}>
                        If you didn't request a password reset, you can safely ignore this email.
                        Your password will remain unchanged.
                    </Text>
                    <Text style={footer}>
                        This link will expire in 1 hour for security reasons.
                    </Text>
                </Section>
            </Container>
        </Body>
    </Html>
)

// Simple, clean styles
const main = {
    backgroundColor: "#f6f9fc",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
}

const container = {
    backgroundColor: "#ffffff",
    border: "1px solid #e6ebf1",
    borderRadius: "5px",
    margin: "40px auto",
    padding: "20px",
    width: "465px"
}

const heading = {
    color: "#32325d",
    fontSize: "24px",
    fontWeight: "600",
    lineHeight: "1.25",
    margin: "0 0 20px"
}

const text = {
    color: "#525f7f",
    fontSize: "16px",
    lineHeight: "1.4",
    margin: "0 0 16px"
}

const button = {
    backgroundColor: "#656ee8",
    borderRadius: "5px",
    color: "#fff",
    display: "inline-block",
    fontSize: "16px",
    fontWeight: "600",
    lineHeight: "1",
    padding: "12px 20px",
    textDecoration: "none",
    margin: "16px 0"
}

const footer = {
    color: "#8898aa",
    fontSize: "14px",
    lineHeight: "1.4",
    margin: "16px 0 0"
}
