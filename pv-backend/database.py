"""Exact CEC selection: never silently select a different component."""
import csv
from functools import lru_cache
from config import EQ_DATABASE_DIR

@lru_cache(maxsize=2)
def records(filename):
    with (EQ_DATABASE_DIR / filename).open(encoding='utf-8-sig') as f:
        rows = csv.reader(f)
        headers = next(rows); next(rows); names = next(rows)
        return {row[0]: {**dict(zip(headers, row)), 'pysam': {
            n.strip(): v.strip() for n,v in zip(names,row) if n.strip() and v.strip()
        }} for row in rows if row}

class Database:
    def get_module(self, name):
        return self._get('CEC Modules.csv', name)
    def get_inverter(self, name):
        return self._get('CEC Inverters.csv', name)
    def _get(self, filename, name):
        try: return records(filename)[name]
        except KeyError: raise ValueError('Pilih nama peralatan lengkap dari katalog CEC.')
