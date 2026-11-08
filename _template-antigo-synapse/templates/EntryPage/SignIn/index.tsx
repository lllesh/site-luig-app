import { useState } from "react";
import { useRouter } from "next/navigation";
import Field from "@/components/Field";

type SignInProps = {};

const SignIn = ({}: SignInProps) => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const router = useRouter();

    const handleSubmit = (e: any) => {
        e.preventDefault();
        router.push("/");
    };

    return (
        <form action="" onSubmit={handleSubmit}>
            <Field
                className="mb-3.5"
                label="Email"
                placeholder="Enter email"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
            />
            <Field
                className="mb-8"
                label="Password"
                placeholder="Enter password"
                type="password"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
            />
            <button className="btn-gradient w-full" type="submit">
                Sign in
            </button>
        </form>
    );
};

export default SignIn;
