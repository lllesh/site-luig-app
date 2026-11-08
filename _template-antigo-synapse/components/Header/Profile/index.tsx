import { useRef, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import Image from "@/components/Image";
import DropdownButton from "@/components/DropdownButton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/utils/supabase";

type ProfileProps = {};

const Profile = ({}: ProfileProps) => {
    const { user, signInWithGoogle, signOut } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const avatarUrl =
        (user?.user_metadata?.avatar_url as string) || "/images/avatar.jpg";

    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !user) return;

        setUploading(true);
        const path = `avatars/${user.id}-${Date.now()}.${file.name
            .split(".")
            .pop()}`;

        const { error: uploadError } = await supabase.storage
            .from("media")
            .upload(path, file, { upsert: true });

        if (!uploadError) {
            const {
                data: { publicUrl },
            } = supabase.storage.from("media").getPublicUrl(path);
            await supabase.auth.updateUser({
                data: { avatar_url: publicUrl },
            });
        }
        setUploading(false);
    };

    const menu = user
        ? [
              {
                  title: uploading ? "Uploading…" : "Change photo",
                  icon: "settings",
                  onClick: () => !uploading && fileInputRef.current?.click(),
              },
              {
                  title: "Settings",
                  icon: "settings",
                  url: "/settings",
              },
              {
                  title: "Manage subscription",
                  icon: "manage",
                  url: "/pricing-and-payment",
              },
              {
                  title: "Log out",
                  icon: "logout",
                  onClick: () => signOut(),
              },
          ]
        : [
              {
                  title: "Sign in with Google",
                  icon: "logout",
                  onClick: () => signInWithGoogle(),
              },
          ];

    return (
        <div className="relative z-10 ml-auto md:ml-2">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
            <Menu>
                <Menu.Button className="relative shrink-0 w-9 h-9">
                    <Image
                        className="w-full h-full object-cover rounded-full opacity-100"
                        src={avatarUrl}
                        width={36}
                        height={36}
                        alt="Avatar"
                        priority
                    />
                    {user && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 border-2 border-n-1 bg-color-5 rounded-full dark:border-n-6"></div>
                    )}
                </Menu.Button>
                <Transition
                    enter="transition duration-100 ease-out"
                    enterFrom="transform scale-95 opacity-0"
                    enterTo="transform scale-100 opacity-100"
                    leave="transition duration-75 ease-out"
                    leaveFrom="transform scale-100 opacity-100"
                    leaveTo="transform scale-95 opacity-0"
                >
                    <Menu.Items className="absolute top-full -right-0.5 w-[18.125rem] mt-2 p-5 bg-n-1 rounded-2xl shadow-modal outline-none md:right-0 dark:bg-noite">
                        {menu.map((item: any, index) => (
                            <Menu.Item
                                className="mb-1 last:mb-0"
                                key={index}
                                as="div"
                            >
                                <DropdownButton item={item} />
                            </Menu.Item>
                        ))}
                    </Menu.Items>
                </Transition>
            </Menu>
        </div>
    );
};

export default Profile;
