import copy
import pytest

from fastapi.testclient import TestClient

from src import app as app_module


client = TestClient(app_module.app)


@pytest.fixture(autouse=True)
def restore_activities():
    """Restore the in-memory activities after each test to avoid cross-test pollution."""
    original = copy.deepcopy(app_module.activities)
    yield
    app_module.activities.clear()
    app_module.activities.update(copy.deepcopy(original))


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_duplicate():
    activity = "Science Club"
    email = "tester@example.com"
    # ensure clean state
    if email in app_module.activities[activity]["participants"]:
        app_module.activities[activity]["participants"].remove(email)

    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    assert email in app_module.activities[activity]["participants"]

    # duplicate signup should return 400
    res2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert res2.status_code == 400


def test_delete_participant():
    activity = "Math Competition Team"
    participants = app_module.activities[activity]["participants"]
    if not participants:
        participants.append("temp@example.com")
    email = participants[0]

    res = client.delete(f"/activities/{activity}/participants?email={email}")
    assert res.status_code == 200
    assert email not in app_module.activities[activity]["participants"]

    # deleting again should return 404
    res2 = client.delete(f"/activities/{activity}/participants?email={email}")
    assert res2.status_code == 404


def test_delete_nonexistent_activity():
    res = client.delete("/activities/NoSuchActivity/participants?email=a@b.com")
    assert res.status_code == 404
