CREATE TABLE CounselingSchema (
    date STRING,
    student_id STRING,

    -- academic
    level STRING,
    program STRING,

    guidance_service_availed STRING,
    contact_type STRING,
    nature_of_concern STRING,
    specific_concern STRING,

    -- session summary
    concern STRING,
    intervention STRING,
    status STRING,
    remarks STRING
);

CREATE TABLE InformationSchema (
    date STRING,

    -- academic
    level STRING,
    program STRING,

    seminar_workshop_title STRING,

    -- links
    evaluation_result STRING,
    documentation STRING,
    fb_page_post STRING
);