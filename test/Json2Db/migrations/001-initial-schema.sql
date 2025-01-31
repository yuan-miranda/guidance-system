-- https://go.microsoft.com/fwlink/?LinkID=521962
CREATE TABLE FinancialSample (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    segment TEXT NOT NULL,
    country TEXT NOT NULL,
    product TEXT NOT NULL,
    discount_band TEXT NOT NULL,
    units_sold REAL NOT NULL,
    manufacturing_price REAL NOT NULL,
    sale_price REAL NOT NULL,
    gross_sales REAL NOT NULL,
    discounts REAL NOT NULL,
    sales REAL NOT NULL,
    cogs REAL NOT NULL,
    profit REAL NOT NULL,
    date TEXT NOT NULL,
    month_number INTEGER NOT NULL,
    month_name TEXT NOT NULL,
    year INTEGER NOT NULL
);