from app.services.pinyin_service import decompose_pinyin, get_pinyin


def test_get_pinyin_basic():
    result = get_pinyin("你好")
    assert len(result) == 2
    assert result[0][0] == "你"
    assert result[1][0] == "好"
    # Check that pinyin is returned (exact values depend on pypinyin)
    assert result[0][1].startswith("ni")
    assert result[1][1].startswith("hao")


def test_get_pinyin_skips_punctuation():
    result = get_pinyin("你好，世界！")
    assert len(result) == 4
    chars = [c for c, _ in result]
    assert chars == ["你", "好", "世", "界"]


def test_get_pinyin_mixed_text():
    result = get_pinyin("我是ABC学生")
    chars = [c for c, _ in result]
    assert "我" in chars
    assert "是" in chars
    assert "学" in chars
    assert "生" in chars
    # ABC should be skipped
    assert "A" not in chars


def test_decompose_pinyin_with_initial():
    ini, fin, tone = decompose_pinyin("zhong1")
    assert ini == "zh"
    assert fin == "ong"
    assert tone == "1"


def test_decompose_pinyin_no_initial():
    ini, fin, tone = decompose_pinyin("ai4")
    assert ini == ""
    assert fin == "ai"
    assert tone == "4"


def test_decompose_pinyin_neutral_tone():
    ini, fin, tone = decompose_pinyin("de")
    assert ini == "d"
    assert fin == "e"
    assert tone == "5"


def test_decompose_pinyin_sh_initial():
    ini, fin, tone = decompose_pinyin("shi4")
    assert ini == "sh"
    assert fin == "i"
    assert tone == "4"
