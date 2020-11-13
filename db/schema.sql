SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: file_entity_file_type_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.file_entity_file_type_enum AS ENUM (
    'CSS',
    'CSV',
    'IMAGE',
    'PDF',
    'SVG',
    'MD',
    'DOC',
    'OTHER'
);


--
-- Name: role_teamroleauthorizations_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.role_teamroleauthorizations_enum AS ENUM (
    'ADMIN',
    'OWNER',
    'MEMBER',
    'PUBLIC_GUEST'
);


--
-- Name: user_to_team_teamroleauthorizations_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_to_team_teamroleauthorizations_enum AS ENUM (
    'ADMIN',
    'MEMBER',
    'OWNER',
    'PUBLIC_GUEST'
);


SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: channel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.channel (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    last_message character varying,
    public boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now(),
    name character varying NOT NULL,
    "teamId" uuid
);


--
-- Name: file_entity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.file_entity (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    uri character varying NOT NULL,
    "messageId" uuid,
    "uploadUserId" uuid,
    file_type public.file_entity_file_type_enum DEFAULT 'OTHER'::public.file_entity_file_type_enum NOT NULL
);


--
-- Name: image; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.image (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    uri character varying NOT NULL,
    "messageId" uuid,
    "userId" uuid
);


--
-- Name: message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now(),
    message character varying NOT NULL,
    "sentById" uuid,
    "userId" uuid,
    "channelId" uuid,
    "threadId" uuid
);


--
-- Name: product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL
);


--
-- Name: role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "teamRoleAuthorizations" public.role_teamroleauthorizations_enum[] DEFAULT '{MEMBER}'::public.role_teamroleauthorizations_enum[] NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    "ownerId" uuid
);


--
-- Name: team_members_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_members_user (
    "teamId" uuid NOT NULL,
    "userId" uuid NOT NULL
);


--
-- Name: team_team_roles_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_team_roles_role (
    "teamId" uuid NOT NULL,
    "roleId" uuid NOT NULL
);


--
-- Name: thread; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.thread (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    last_message character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now(),
    "userId" uuid,
    "teamId" uuid
);


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "firstName" character varying NOT NULL,
    "lastName" character varying NOT NULL,
    email text NOT NULL,
    "profileImageUri" text,
    password character varying NOT NULL,
    confirmed boolean DEFAULT false NOT NULL,
    "channelsCreatedId" uuid
);


--
-- Name: user_channel_memberships_channel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_channel_memberships_channel (
    "userId" uuid NOT NULL,
    "channelId" uuid NOT NULL
);


--
-- Name: user_followers_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_followers_user (
    "userId_1" uuid NOT NULL,
    "userId_2" uuid NOT NULL
);


--
-- Name: user_team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_team (
    name character varying NOT NULL,
    "userId" character varying NOT NULL,
    "teamId" character varying NOT NULL
);


--
-- Name: user_team_roles_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_team_roles_role (
    "userId" uuid NOT NULL,
    "roleId" uuid NOT NULL
);


--
-- Name: user_team_roles_team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_team_roles_team (
    "userId" uuid NOT NULL,
    "teamId" uuid NOT NULL
);


--
-- Name: user_thread_invitations_thread; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_thread_invitations_thread (
    "userId" uuid NOT NULL,
    "threadId" uuid NOT NULL
);


--
-- Name: user_to_team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_to_team (
    "userId" uuid NOT NULL,
    "teamId" uuid NOT NULL,
    "teamRoleAuthorizations" public.user_to_team_teamroleauthorizations_enum[] DEFAULT '{MEMBER}'::public.user_to_team_teamroleauthorizations_enum[] NOT NULL,
    "userToTeamId" uuid DEFAULT public.uuid_generate_v4() NOT NULL
);


--
-- Name: user_channel_memberships_channel PK_50a021edd4be261d0386d6096d4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_channel_memberships_channel
    ADD CONSTRAINT "PK_50a021edd4be261d0386d6096d4" PRIMARY KEY ("userId", "channelId");


--
-- Name: user_team PK_5344f2beb6d670a703b46d7db0b; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_team
    ADD CONSTRAINT "PK_5344f2beb6d670a703b46d7db0b" PRIMARY KEY ("userId", "teamId");


--
-- Name: channel PK_590f33ee6ee7d76437acf362e39; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.channel
    ADD CONSTRAINT "PK_590f33ee6ee7d76437acf362e39" PRIMARY KEY (id);


--
-- Name: user_thread_invitations_thread PK_8274e65f87421109e32dba0dc87; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_thread_invitations_thread
    ADD CONSTRAINT "PK_8274e65f87421109e32dba0dc87" PRIMARY KEY ("userId", "threadId");


--
-- Name: team_team_roles_role PK_8311c5d93182f43698edef7d840; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_team_roles_role
    ADD CONSTRAINT "PK_8311c5d93182f43698edef7d840" PRIMARY KEY ("teamId", "roleId");


--
-- Name: user_team_roles_role PK_8649163c188d68d1a0419e29b03; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_team_roles_role
    ADD CONSTRAINT "PK_8649163c188d68d1a0419e29b03" PRIMARY KEY ("userId", "roleId");


--
-- Name: team_members_user PK_946e161af78b3cc26186236d3bd; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members_user
    ADD CONSTRAINT "PK_946e161af78b3cc26186236d3bd" PRIMARY KEY ("teamId", "userId");


--
-- Name: user_followers_user PK_980ff03f415077df184596dcf73; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_followers_user
    ADD CONSTRAINT "PK_980ff03f415077df184596dcf73" PRIMARY KEY ("userId_1", "userId_2");


--
-- Name: user_team_roles_team PK_9c15c4901e34a8d8ef71d00eb24; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_team_roles_team
    ADD CONSTRAINT "PK_9c15c4901e34a8d8ef71d00eb24" PRIMARY KEY ("userId", "teamId");


--
-- Name: role PK_b36bcfe02fc8de3c57a8b2391c2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY (id);


--
-- Name: message PK_ba01f0a3e0123651915008bc578; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY (id);


--
-- Name: product PK_bebc9158e480b949565b4dc7a82; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY (id);


--
-- Name: thread PK_cabc0f3f27d7b1c70cf64623e02; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread
    ADD CONSTRAINT "PK_cabc0f3f27d7b1c70cf64623e02" PRIMARY KEY (id);


--
-- Name: user PK_cace4a159ff9f2512dd42373760; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY (id);


--
-- Name: image PK_d6db1ab4ee9ad9dbe86c64e4cc3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image
    ADD CONSTRAINT "PK_d6db1ab4ee9ad9dbe86c64e4cc3" PRIMARY KEY (id);


--
-- Name: file_entity PK_d8375e0b2592310864d2b4974b2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_entity
    ADD CONSTRAINT "PK_d8375e0b2592310864d2b4974b2" PRIMARY KEY (id);


--
-- Name: user_to_team PK_f22996a3ec93b6de42da70cafe1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_to_team
    ADD CONSTRAINT "PK_f22996a3ec93b6de42da70cafe1" PRIMARY KEY ("userToTeamId");


--
-- Name: team PK_f57d8293406df4af348402e4b74; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team
    ADD CONSTRAINT "PK_f57d8293406df4af348402e4b74" PRIMARY KEY (id);


--
-- Name: user UQ_3d328f5ff477a6bd7994cdbe823; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "UQ_3d328f5ff477a6bd7994cdbe823" UNIQUE ("profileImageUri");


--
-- Name: channel UQ_800e6da7e4c30fbb0653ba7bb6c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.channel
    ADD CONSTRAINT "UQ_800e6da7e4c30fbb0653ba7bb6c" UNIQUE (name);


--
-- Name: team UQ_cf461f5b40cf1a2b8876011e1e1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team
    ADD CONSTRAINT "UQ_cf461f5b40cf1a2b8876011e1e1" UNIQUE (name);


--
-- Name: user UQ_e12875dfb3b1d92d7d7c5377e22; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE (email);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: IDX_110f993e5e9213a7a44f172b26; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_110f993e5e9213a7a44f172b26" ON public.user_followers_user USING btree ("userId_2");


--
-- Name: IDX_1c14b9da0b61ead33294f8287e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_1c14b9da0b61ead33294f8287e" ON public.user_channel_memberships_channel USING btree ("channelId");


--
-- Name: IDX_2107c51cd7db9efac1a4ddb7b4; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_2107c51cd7db9efac1a4ddb7b4" ON public.user_thread_invitations_thread USING btree ("threadId");


--
-- Name: IDX_26312a1e34901011fc6f63545e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_26312a1e34901011fc6f63545e" ON public.user_followers_user USING btree ("userId_1");


--
-- Name: IDX_45db1cff3b87cc40512fb2963e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_45db1cff3b87cc40512fb2963e" ON public.team_members_user USING btree ("userId");


--
-- Name: IDX_472f31928b5952348ccc90d5fb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_472f31928b5952348ccc90d5fb" ON public.user_team_roles_role USING btree ("userId");


--
-- Name: IDX_4c2d35883466f964a3d99fe086; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_4c2d35883466f964a3d99fe086" ON public.user_team_roles_team USING btree ("teamId");


--
-- Name: IDX_61cc4a1ddaf8e9ff39977b9565; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_61cc4a1ddaf8e9ff39977b9565" ON public.user_channel_memberships_channel USING btree ("userId");


--
-- Name: IDX_7642a95915ec98698382b77b3b; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_7642a95915ec98698382b77b3b" ON public.user_thread_invitations_thread USING btree ("userId");


--
-- Name: IDX_9b31568355a502f87cc0fadcf5; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_9b31568355a502f87cc0fadcf5" ON public.team_team_roles_role USING btree ("roleId");


--
-- Name: IDX_a81998a4d7adfc0c8cc87338c1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a81998a4d7adfc0c8cc87338c1" ON public.user_team_roles_role USING btree ("roleId");


--
-- Name: IDX_b3f2c420a7871621010a4e1d21; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_b3f2c420a7871621010a4e1d21" ON public.team_members_user USING btree ("teamId");


--
-- Name: IDX_d71b57809bc9368a81caee457e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_d71b57809bc9368a81caee457e" ON public.user_team_roles_team USING btree ("userId");


--
-- Name: IDX_f820d5d91230b96d5dcea6fd6e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_f820d5d91230b96d5dcea6fd6e" ON public.team_team_roles_role USING btree ("teamId");


--
-- Name: user_to_team FK_0517e469efea0df50d97188b2b3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_to_team
    ADD CONSTRAINT "FK_0517e469efea0df50d97188b2b3" FOREIGN KEY ("userId") REFERENCES public."user"(id);


--
-- Name: user_followers_user FK_110f993e5e9213a7a44f172b264; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_followers_user
    ADD CONSTRAINT "FK_110f993e5e9213a7a44f172b264" FOREIGN KEY ("userId_2") REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: channel FK_1401e6454f1c5b030c5080d0842; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.channel
    ADD CONSTRAINT "FK_1401e6454f1c5b030c5080d0842" FOREIGN KEY ("teamId") REFERENCES public.team(id);


--
-- Name: message FK_16dc5617e9947f29b7bb1cb2410; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT "FK_16dc5617e9947f29b7bb1cb2410" FOREIGN KEY ("sentById") REFERENCES public."user"(id);


--
-- Name: user_channel_memberships_channel FK_1c14b9da0b61ead33294f8287e1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_channel_memberships_channel
    ADD CONSTRAINT "FK_1c14b9da0b61ead33294f8287e1" FOREIGN KEY ("channelId") REFERENCES public.channel(id) ON DELETE CASCADE;


--
-- Name: user_thread_invitations_thread FK_2107c51cd7db9efac1a4ddb7b4d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_thread_invitations_thread
    ADD CONSTRAINT "FK_2107c51cd7db9efac1a4ddb7b4d" FOREIGN KEY ("threadId") REFERENCES public.thread(id) ON DELETE CASCADE;


--
-- Name: user_followers_user FK_26312a1e34901011fc6f63545e2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_followers_user
    ADD CONSTRAINT "FK_26312a1e34901011fc6f63545e2" FOREIGN KEY ("userId_1") REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: message FK_446251f8ceb2132af01b68eb593; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT "FK_446251f8ceb2132af01b68eb593" FOREIGN KEY ("userId") REFERENCES public."user"(id);


--
-- Name: team_members_user FK_45db1cff3b87cc40512fb2963ea; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members_user
    ADD CONSTRAINT "FK_45db1cff3b87cc40512fb2963ea" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: user_team_roles_role FK_472f31928b5952348ccc90d5fbd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_team_roles_role
    ADD CONSTRAINT "FK_472f31928b5952348ccc90d5fbd" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: team FK_49a22109d0b97611c07768e37f1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team
    ADD CONSTRAINT "FK_49a22109d0b97611c07768e37f1" FOREIGN KEY ("ownerId") REFERENCES public."user"(id);


--
-- Name: user_team_roles_team FK_4c2d35883466f964a3d99fe0863; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_team_roles_team
    ADD CONSTRAINT "FK_4c2d35883466f964a3d99fe0863" FOREIGN KEY ("teamId") REFERENCES public.team(id) ON DELETE CASCADE;


--
-- Name: thread FK_57782d1d6ab602aa9ff43cf30a2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread
    ADD CONSTRAINT "FK_57782d1d6ab602aa9ff43cf30a2" FOREIGN KEY ("userId") REFERENCES public."user"(id);


--
-- Name: message FK_5fdbbcb32afcea663c2bea2954f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT "FK_5fdbbcb32afcea663c2bea2954f" FOREIGN KEY ("channelId") REFERENCES public.channel(id);


--
-- Name: user_channel_memberships_channel FK_61cc4a1ddaf8e9ff39977b95659; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_channel_memberships_channel
    ADD CONSTRAINT "FK_61cc4a1ddaf8e9ff39977b95659" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: user_thread_invitations_thread FK_7642a95915ec98698382b77b3bd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_thread_invitations_thread
    ADD CONSTRAINT "FK_7642a95915ec98698382b77b3bd" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: file_entity FK_7ddbb467eade83bf981df8c5664; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_entity
    ADD CONSTRAINT "FK_7ddbb467eade83bf981df8c5664" FOREIGN KEY ("uploadUserId") REFERENCES public."user"(id);


--
-- Name: message FK_97e5c5b5590c682a6c487816b6b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message
    ADD CONSTRAINT "FK_97e5c5b5590c682a6c487816b6b" FOREIGN KEY ("threadId") REFERENCES public.thread(id);


--
-- Name: team_team_roles_role FK_9b31568355a502f87cc0fadcf5e; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_team_roles_role
    ADD CONSTRAINT "FK_9b31568355a502f87cc0fadcf5e" FOREIGN KEY ("roleId") REFERENCES public.role(id) ON DELETE CASCADE;


--
-- Name: user_to_team FK_a229289a308a922166de722801f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_to_team
    ADD CONSTRAINT "FK_a229289a308a922166de722801f" FOREIGN KEY ("teamId") REFERENCES public.team(id);


--
-- Name: user_team_roles_role FK_a81998a4d7adfc0c8cc87338c12; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_team_roles_role
    ADD CONSTRAINT "FK_a81998a4d7adfc0c8cc87338c12" FOREIGN KEY ("roleId") REFERENCES public.role(id) ON DELETE CASCADE;


--
-- Name: team_members_user FK_b3f2c420a7871621010a4e1d212; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members_user
    ADD CONSTRAINT "FK_b3f2c420a7871621010a4e1d212" FOREIGN KEY ("teamId") REFERENCES public.team(id) ON DELETE CASCADE;


--
-- Name: file_entity FK_bcc014998edf30847460a40474d; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_entity
    ADD CONSTRAINT "FK_bcc014998edf30847460a40474d" FOREIGN KEY ("messageId") REFERENCES public.message(id);


--
-- Name: user_team_roles_team FK_d71b57809bc9368a81caee457e9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_team_roles_team
    ADD CONSTRAINT "FK_d71b57809bc9368a81caee457e9" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: thread FK_da5dd34994fb16b67b415cdf49b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thread
    ADD CONSTRAINT "FK_da5dd34994fb16b67b415cdf49b" FOREIGN KEY ("teamId") REFERENCES public.team(id);


--
-- Name: image FK_dc40417dfa0c7fbd70b8eb880cc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image
    ADD CONSTRAINT "FK_dc40417dfa0c7fbd70b8eb880cc" FOREIGN KEY ("userId") REFERENCES public."user"(id);


--
-- Name: user FK_e13e7ac26c2d8b7561306908425; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "FK_e13e7ac26c2d8b7561306908425" FOREIGN KEY ("channelsCreatedId") REFERENCES public.channel(id);


--
-- Name: image FK_f69c7f02013805481ec0edcf3ea; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.image
    ADD CONSTRAINT "FK_f69c7f02013805481ec0edcf3ea" FOREIGN KEY ("messageId") REFERENCES public.message(id);


--
-- Name: team_team_roles_role FK_f820d5d91230b96d5dcea6fd6ee; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_team_roles_role
    ADD CONSTRAINT "FK_f820d5d91230b96d5dcea6fd6ee" FOREIGN KEY ("teamId") REFERENCES public.team(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


--
-- Dbmate schema migrations
--

