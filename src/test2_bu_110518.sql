--
-- PostgreSQL database dump
--

-- Dumped from database version 9.5.12
-- Dumped by pg_dump version 9.5.12

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: plpgsql; Type: EXTENSION; Schema: -; Owner: 
--

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;


--
-- Name: EXTENSION plpgsql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';


--
-- Name: delete_dead_mottos(); Type: FUNCTION; Schema: public; Owner: test2
--

CREATE FUNCTION public.delete_dead_mottos() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
DELETE FROM hashes WHERE modetime + (life+15) * INTERVAL '1 minute'  < NOW();
RETURN NULL;
END;
$$;


ALTER FUNCTION public.delete_dead_mottos() OWNER TO test2;

--
-- Name: delete_old_access_logs(); Type: FUNCTION; Schema: public; Owner: test2
--

CREATE FUNCTION public.delete_old_access_logs() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
DELETE FROM access_logs WHERE timestamp < NOW() - 4*INTERVAL '1 hour';
RETURN NULL;
END;
$$;


ALTER FUNCTION public.delete_old_access_logs() OWNER TO test2;

--
-- Name: live_hashes(); Type: FUNCTION; Schema: public; Owner: test2
--

CREATE FUNCTION public.live_hashes() RETURNS TABLE(did integer, hash character varying, mtime timestamp without time zone, shill integer, life integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
RETURN QUERY SELECT
hashes.did, hashes.hash, hashes.modetime, hashes.shill, hashes.life
FROM
hashes
WHERE (hashes.shill>0 AND (hashes.modetime+hashes.life * INTERVAL '1 minute' ) > NOW() );
END $$;


ALTER FUNCTION public.live_hashes() OWNER TO test2;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: access_logs; Type: TABLE; Schema: public; Owner: test2
--

CREATE TABLE public.access_logs (
    ip character varying NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.access_logs OWNER TO test2;

--
-- Name: hashes; Type: TABLE; Schema: public; Owner: test2
--

CREATE TABLE public.hashes (
    did integer NOT NULL,
    hash character varying,
    modetime timestamp without time zone DEFAULT now(),
    life integer DEFAULT 60,
    shill integer DEFAULT 60,
    interaction integer DEFAULT 0
);


ALTER TABLE public.hashes OWNER TO test2;

--
-- Name: hashes_did_seq; Type: SEQUENCE; Schema: public; Owner: test2
--

CREATE SEQUENCE public.hashes_did_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.hashes_did_seq OWNER TO test2;

--
-- Name: hashes_did_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test2
--

ALTER SEQUENCE public.hashes_did_seq OWNED BY public.hashes.did;


--
-- Name: users; Type: TABLE; Schema: public; Owner: test2
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    username character varying(255),
    password character varying(100),
    type character varying(50),
    isallowed boolean DEFAULT true,
    points integer DEFAULT 100,
    registerdate timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO test2;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: test2
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO test2;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: test2
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: did; Type: DEFAULT; Schema: public; Owner: test2
--

ALTER TABLE ONLY public.hashes ALTER COLUMN did SET DEFAULT nextval('public.hashes_did_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: test2
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: access_logs; Type: TABLE DATA; Schema: public; Owner: test2
--

COPY public.access_logs (ip, "timestamp") FROM stdin;
::ffff:127.0.0.1	2018-05-10 12:02:56.522221
\.


--
-- Data for Name: hashes; Type: TABLE DATA; Schema: public; Owner: test2
--

COPY public.hashes (did, hash, modetime, life, shill, interaction) FROM stdin;
193	QmW2aQvCsNfQ8ryyDN14zBVL4rQ63YpTf22cVcEEFKhXEN	2018-05-10 13:29:44.789892	16	16	2
194	QmRqtyWtuQsNCiGD13nFrL5rMYWmSZTP57mC2EtUHbmtrP	2018-05-10 13:29:44.789892	16	14	2
\.


--
-- Name: hashes_did_seq; Type: SEQUENCE SET; Schema: public; Owner: test2
--

SELECT pg_catalog.setval('public.hashes_did_seq', 194, true);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: test2
--

COPY public.users (id, username, password, type, isallowed, points, registerdate) FROM stdin;
\.


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: test2
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: constraint_name; Type: CONSTRAINT; Schema: public; Owner: test2
--

ALTER TABLE ONLY public.hashes
    ADD CONSTRAINT constraint_name UNIQUE (did, hash);


--
-- Name: hashes_hash_key; Type: CONSTRAINT; Schema: public; Owner: test2
--

ALTER TABLE ONLY public.hashes
    ADD CONSTRAINT hashes_hash_key UNIQUE (hash);


--
-- Name: users_pkey; Type: CONSTRAINT; Schema: public; Owner: test2
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users_username_key; Type: CONSTRAINT; Schema: public; Owner: test2
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: trigger_delete_dead_mottos; Type: TRIGGER; Schema: public; Owner: test2
--

CREATE TRIGGER trigger_delete_dead_mottos AFTER INSERT ON public.access_logs FOR EACH STATEMENT EXECUTE PROCEDURE public.delete_dead_mottos();


--
-- Name: trigger_delete_old_access_logs; Type: TRIGGER; Schema: public; Owner: test2
--

CREATE TRIGGER trigger_delete_old_access_logs AFTER INSERT ON public.access_logs FOR EACH STATEMENT EXECUTE PROCEDURE public.delete_old_access_logs();


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

