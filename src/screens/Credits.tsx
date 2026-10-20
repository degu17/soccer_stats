import creditsJson from '../data/credits.json';
import { SUSPECTS } from '../data/cases';
import { useApp } from '../state';
import { PrintPhoto, TopBar } from '../components/ui';

interface PhotoCredit {
  author: string;
  license: string;
  licenseUrl: string;
  source: string;
}

const PHOTO_CREDITS = creditsJson as Record<string, PhotoCredit>;
const RETRIEVED = '2026-10-20';

export function Credits() {
  const app = useApp();
  const withPhoto = SUSPECTS.filter((s) => s.photoStatus === 'ready');

  return (
    <div class="screen dx-screen dx-credits">
      <TopBar onBack={() => app.go({ name: 'title' })} kicker="CREDITS" title="クレジット" />
      <div class="grow dx-scroll dx-credits-scroll">
        <header class="dx-credits-head">
          <span class="kicker">PHOTO & DATA</span>
          <h1 class="display">写真と出典</h1>
          <p>
            写真は Wikimedia Commons の自由ライセンス作品を、網点加工・トリミングして使用しています。
            選手データは Wikipedia と J.League Data Site を基準に、リーグ戦の数字へ揃えました。
          </p>
        </header>

        <section class="dx-credit-section">
          <div class="dx-section-head">
            <span class="kicker">PHOTOGRAPHS</span>
            <h2 class="display">写真クレジット</h2>
            <span class="dx-rule" />
          </div>
          <ul class="dx-photo-credits">
            {withPhoto.map((suspect) => {
              const credit = PHOTO_CREDITS[suspect.id];
              if (!credit) return null;
              return (
                <li key={suspect.id}>
                  {suspect.photo && <PrintPhoto src={suspect.photo} alt={suspect.nameJa} w={46} h={56} />}
                  <div>
                    <b>{suspect.nameJa}</b>
                    <small>
                      Photo: {credit.author} /{' '}
                      <a href={credit.licenseUrl} target="_blank" rel="noopener">
                        {credit.license}
                      </a>{' '}
                      /{' '}
                      <a href={credit.source} target="_blank" rel="noopener">
                        Wikimedia Commons
                      </a>
                    </small>
                  </div>
                </li>
              );
            })}
          </ul>
          <p class="dx-note">
            写真はすべて収録済みです。加工前の原画とライセンス情報は、上記の出典リンクから確認できます。
          </p>
        </section>

        <section class="dx-credit-section">
          <div class="dx-section-head">
            <span class="kicker">DATA SOURCES</span>
            <h2 class="display">データ出典</h2>
            <span class="dx-rule" />
          </div>
          <ul class="dx-data-credits">
            {SUSPECTS.map((suspect) => (
              <li key={suspect.id}>
                <b>{suspect.nameJa}</b>
                <ul>
                  {suspect.sources.map((source) => (
                    <li key={`${suspect.id}-${source.label}`}>
                      {source.url.startsWith('http') ? (
                        <a href={source.url} target="_blank" rel="noopener">
                          {source.label}
                        </a>
                      ) : (
                        source.label
                      )}
                      <span class="mono"> / {source.retrievedAt}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <p class="dx-note">データ基準日: {RETRIEVED}。移籍・所属クラブ数・受賞歴は、事件ファイルごとに定義した基準で数えています。</p>
        </section>

        <section class="dx-credit-section">
          <div class="dx-section-head">
            <span class="kicker">NOTICE</span>
            <h2 class="display">この作品について</h2>
            <span class="dx-rule" />
          </div>
          <p>
            スタッツ探偵は、サッカーの数字を推理パズルとして楽しむ非公式のファンメイド作品です。
            各クラブ・リーグ・選手・団体とは関係ありません。選手名は正体判明後に表示されます。
          </p>
          <p class="mono dx-credit-version">STATS DETECTIVE / VOL.1 / BUILD 0.1</p>
        </section>
      </div>
    </div>
  );
}
