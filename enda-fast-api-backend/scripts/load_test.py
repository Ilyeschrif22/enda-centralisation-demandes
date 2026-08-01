import time
import random
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests

URL = "http://localhost:8000/names/translate"

NAMES = [
    "محمد الشريف",
    "فاطمة بن علي",
    "سيف الدين",
    "أحمد الطرابلسي",
    "منى الغربي",
    "يوسف قروي",
    "خديجة المصري",
    "كريم بوعزيزي",
    "سلمى الجبالي",
    "وليد الحمروني",
    "أمين الزغلامي",
    "ريم بن سالم",
    "نور الدين",
    "هدى الشابي",
    "طارق المسعودي",
    "زينب الفرشيشي",
    "بلال العيادي",
    "سناء الجندوبي",
    "حمزة الورغي",
    "لمياء التونسي",
    "عماد بوغانمي",
    "ياسمين الصغير",
    "رياض النفزاوي",
    "إيمان الماجري",
    "معز الحداد",
    "شيماء بن رمضان",
    "أنيس الكافي",
    "ندى الرياحي",
    "فراس الجلاصي",
    "دينا الميساوي",
]

TOTAL_REQUESTS = 2000
CONCURRENCY = 50  # nombre de requêtes simultanées


def send_request(_):
    name = random.choice(NAMES)
    start = time.time()
    try:
        response = requests.post(URL, json={"name": name}, timeout=10)
        elapsed = time.time() - start
        return response.status_code, elapsed
    except Exception as e:
        return "ERROR", str(e)


def main():
    print(f"Lancement de {TOTAL_REQUESTS} requêtes avec {CONCURRENCY} en parallèle...")

    results = []
    start_all = time.time()

    with ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
        futures = [executor.submit(send_request, i) for i in range(TOTAL_REQUESTS)]
        for future in as_completed(futures):
            results.append(future.result())

    total_time = time.time() - start_all

    success = [r for r in results if r[0] == 200]
    errors = [r for r in results if r[0] != 200]
    times = [r[1] for r in success]

    print("\n--- Résultats ---")
    print(f"Total requêtes:      {TOTAL_REQUESTS}")
    print(f"Succès:              {len(success)}")
    print(f"Erreurs:             {len(errors)}")
    print(f"Temps total:         {total_time:.2f}s")
    print(f"Requêtes/seconde:    {TOTAL_REQUESTS / total_time:.2f}")

    if times:
        print(f"Temps moyen:         {sum(times)/len(times)*1000:.2f} ms")
        print(f"Temps min:           {min(times)*1000:.2f} ms")
        print(f"Temps max:           {max(times)*1000:.2f} ms")

    if errors:
        print("\nExemples d'erreurs:")
        for e in errors[:5]:
            print(e)


if __name__ == "__main__":
    main()