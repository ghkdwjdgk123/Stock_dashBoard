import pytest

from stock_collector.kiwoom_client import KiwoomClient, KiwoomError


class FakeResponse:
    def __init__(self, payload, headers=None):
        self.payload = payload
        self.headers = headers or {}

    def raise_for_status(self):
        pass

    def json(self):
        return self.payload


class FakeSession:
    def __init__(self, responses):
        self.responses = iter(responses)
        self.calls = []

    def post(self, url, **kwargs):
        self.calls.append((url, kwargs))
        return next(self.responses)


def test_paginates_minute_chart_and_sends_continuation_headers():
    fake = FakeSession([
        FakeResponse({"return_code": 0, "token": "secret"}),
        FakeResponse({"return_code": 0, "stk_min_pole_chart_qry": [{"cntr_tm": "20261110130000"}]},
                     {"cont-yn": "Y", "next-key": "page2"}),
        FakeResponse({"return_code": 0, "stk_min_pole_chart_qry": [{"cntr_tm": "20261110125900"}]},
                     {"cont-yn": "N"}),
    ])
    client = KiwoomClient("https://api.kiwoom.com", "key", "secret", 0, fake)
    pages = list(client.iter_minute_pages("005930", 1, 3))
    assert len(pages) == 2
    assert fake.calls[1][1]["headers"]["api-id"] == "ka10080"
    assert fake.calls[2][1]["headers"]["next-key"] == "page2"
    assert fake.calls[2][1]["headers"]["cont-yn"] == "Y"


def test_fails_loudly_on_api_error():
    fake = FakeSession([FakeResponse({"return_code": -100, "return_msg": "query limit"})])
    with pytest.raises(KiwoomError):
        KiwoomClient("https://api.kiwoom.com", "key", "secret", 0, fake).get_token()


def test_rejects_bad_code_before_network():
    client = KiwoomClient("https://api.kiwoom.com", "key", "secret", 0, FakeSession([]))
    with pytest.raises(ValueError):
        list(client.iter_minute_pages("00593", 1, 1))
