export interface UserDetailProps {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_color: string;
    last_login : string;
    roles: {
        id: string;
        name: string;
    }[];
    created_at: string;
    username: string;
}


export interface MyInfoProps {
    user_id:string;
    email:string;
    name:string;
    role:number;
    pwd_status:boolean;
    login_google:string;
}