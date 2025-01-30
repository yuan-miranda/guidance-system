CREATE TABLE Academic (
    id INTEGER PRIMARY KEY,
    level STRING,
    program STRING
);

CREATE TABLE SessionSummary (
    id INTEGER PRIMARY KEY,
    concern STRING,
    intervention STRING,
    status STRING,
    remarks STRING
);

CREATE TABLE Links (
    id INTEGER PRIMARY KEY,
    evaluation_result STRING,
    documentation STRING,
    fb_page_post STRING
)

CREATE TABLE CounselingSchema (
    date STRING,
    student_id STRING,

    -- academic
    academic_id INTEGER,
    FOREIGN KEY (academic_id) REFERENCES Academic(id),

    guidance_service_availed STRING,
    contact_type STRING,
    nature_of_concern STRING,
    specific_concern STRING,

    -- session summary
    session_summary_id INTEGER,
    FOREIGN KEY (session_summary_id) REFERENCES SessionSummary(id)
);

CREATE TABLE InformationSchema (
    date STRING,

    -- academic
    academic_id INTEGER,
    FOREIGN KEY (academic_id) REFERENCES Academic(id),

    seminar_workshop_title STRING,

    -- links
    links_id INTEGER,
    FOREIGN KEY (links_id) REFERENCES Links(id)
);