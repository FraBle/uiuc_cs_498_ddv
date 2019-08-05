#!/usr/bin/env python3.7
import csv
import json
from mmap import mmap
from collections import defaultdict
from pathlib import Path
from pprint import pprint

import click
import click_pathlib
from loguru import logger
from tqdm import tqdm

ROOT = Path(__file__).resolve().parent.parent
INPUT_PATH = ROOT / "_raw_data"
OUTPUT_PATH = ROOT / "data"
COLUMNS = [
    "Age",
    "ConvertedComp",
    "Country",
    "YearsCodePro",
]
SPLIT_COLUMNS = [
    "Gender",
    "LanguageWorkedWith",
]

def get_num_lines(file_path):
    lines = 0
    with open(file_path, "r+") as input_file:
        buffer = mmap(input_file.fileno(), 0)
        while buffer.readline():
            lines += 1
    return lines

def filter_empty_fields(line):
    if  line.get("Age") == "NA" or \
        line.get("ConvertedComp") == "NA" or \
        line.get("Country") == "NA" or \
        line.get("YearsCodePro") == "NA" or \
        line.get("LanguageWorkedWith") == ["Other(s):"] or \
        line.get("LanguageWorkedWith") == ["NA"] or \
        line.get("Gender") == ["NA"]:
        return
    return line

@click.option(
    "-p",
    "--developer-survey-path",
    default=INPUT_PATH,
    type=click_pathlib.Path(exists=True),
)
@click.command()
def preprocess(developer_survey_path):
    """Preprocess the Stack Overflow Developer Survey 2019 Data for D3 charts"""

    chart_data = []
    csv_path = developer_survey_path / 'survey_results_public.csv'
    entries = get_num_lines(csv_path) - 1

    with open(csv_path, newline='') as survey_results:
        for row in tqdm(csv.DictReader(survey_results), total=entries):
            result = filter_empty_fields(
                {**{key: row[key] for key in COLUMNS},
                **{key: row[key].split(";") for key in SPLIT_COLUMNS}}
            )
            if result:
                chart_data.append(result)

    # Make sure the output path exists
    Path(OUTPUT_PATH).mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_PATH / "chart.json", "w+") as output_file:
        json.dump(chart_data, output_file)

    logger.info("Created a data set with {filtered_length} rows out of {total_length}",
        filtered_length = len(chart_data),
        total_length = entries
    )

if __name__ == "__main__":
    preprocess()
