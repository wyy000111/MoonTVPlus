/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, no-console */

'use client';

import { Bot, ChevronRight, Link as LinkIcon, ListVideo, Music } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import {
  BangumiCalendarData,
  GetBangumiCalendarData,
} from '@/lib/bangumi.client';
import { getDoubanCategories } from '@/lib/douban.client';
import { getTMDBImageUrl, TMDBItem } from '@/lib/tmdb.client';
import { DoubanItem } from '@/lib/types';
import { base58Encode, processImageUrl } from '@/lib/utils';

import AIChatPanel from '@/components/AIChatPanel';
import BannerCarousel from '@/components/BannerCarousel';
import ContinueWatching from '@/components/ContinueWatching';
import FireworksCanvas from '@/components/FireworksCanvas';
import HttpWarningDialog from '@/components/HttpWarningDialog';
import PageLayout from '@/components/PageLayout';
import ScrollableRow from '@/components/ScrollableRow';
import { useSite } from '@/components/SiteProvider';
import VideoCard from '@/components/VideoCard';

// 首页模块配置接口
interface HomeModule {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

function HomeClient() {
  // 移除了 activeTab 状态，收藏夹功能已移到 UserMenu
  const [hotMovies, setHotMovies] = useState<DoubanItem[]>([]);
  const [hotTvShows, setHotTvShows] = useState<DoubanItem[]>([]);
  const [hotVarietyShows, setHotVarietyShows] = useState<DoubanItem[]>([]);
  const [hotDuanju, setHotDuanju] = useState<any[]>([]);
  const [upcomingContent, setUpcomingContent] = useState<TMDBItem[]>([]);
  const [bangumiCalendarData, setBangumiCalendarData] = useState<
    BangumiCalendarData[]
  >([]);
  const [loading, setLoading] = useState(true);
  const { announcement } = useSite();
  const router = useRouter();

  // 首页模块配置状态
  const [homeModules, setHomeModules] = useState<HomeModule[]>([
    { id: 'hotMovies', name: '热门电影', enabled: true, order: 0 },
    { id: 'hotDuanju', name: '热播短剧', enabled: true, order: 1 },
    { id: 'bangumiCalendar', name: '新番放送', enabled: true, order: 2 },
    { id: 'hotTvShows', name: '热门剧集', enabled: true, order: 3 },
    { id: 'hotVarietyShows', name: '热门综艺', enabled: true, order: 4 },
    { id: 'upcomingContent', name: '即将上映', enabled: true, order: 5 },
    { id: 'link', name: '网站联盟', enabled: true, order: 6 },
  ]);
  const [homeBannerEnabled, setHomeBannerEnabled] = useState(true);
  const [homeContinueWatchingEnabled, setHomeContinueWatchingEnabled] = useState(true);

  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [showHttpWarning, setShowHttpWarning] = useState(true);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiDefaultMessageNoVideo, setAiDefaultMessageNoVideo] = useState('你好！我是MoonTVPlus的AI影视助手。想看什么电影或剧集？需要推荐吗？');
  const [sourceSearchEnabled, setSourceSearchEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [showDirectPlayDialog, setShowDirectPlayDialog] = useState(false);
  const [directPlayUrl, setDirectPlayUrl] = useState('');

  const handleDirectPlay = () => {
    setDirectPlayUrl('');
    setShowDirectPlayDialog(true);
  };

  const submitDirectPlay = () => {
    const trimmed = directPlayUrl.trim();
    if (!trimmed) return;
    const encoded = base58Encode(trimmed);
    if (!encoded) return;
    setShowDirectPlayDialog(false);
    setDirectPlayUrl('');
    router.push(`/play?source=directplay&id=${encodeURIComponent(encoded)}`);
  };

  const loadHomeLayoutSettings = () => {
    if (typeof window === 'undefined') return;

    const savedHomeModules = localStorage.getItem('homeModules');
    if (savedHomeModules) {
      try {
        setHomeModules(JSON.parse(savedHomeModules));
      } catch (error) {
        console.error('解析首页模块配置失败:', error);
      }
    }

    const savedHomeBannerEnabled = localStorage.getItem('homeBannerEnabled');
    if (savedHomeBannerEnabled !== null) {
      setHomeBannerEnabled(savedHomeBannerEnabled === 'true');
    }

    const savedHomeContinueWatchingEnabled = localStorage.getItem('homeContinueWatchingEnabled');
    if (savedHomeContinueWatchingEnabled !== null) {
      setHomeContinueWatchingEnabled(savedHomeContinueWatchingEnabled === 'true');
    }
  };

  // 加载首页模块配置
  useEffect(() => {
    loadHomeLayoutSettings();
  }, []);

  // 监听首页模块配置更新事件
  useEffect(() => {
    const handleHomeModulesUpdated = () => {
      loadHomeLayoutSettings();
    };

    window.addEventListener('homeModulesUpdated', handleHomeModulesUpdated);
    return () => {
      window.removeEventListener('homeModulesUpdated', handleHomeModulesUpdated);
    };
  }, []);

  // 检查AI功能是否启用
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const enabled =
        (window as any).RUNTIME_CONFIG?.AI_ENABLED &&
        (window as any).RUNTIME_CONFIG?.AI_ENABLE_HOMEPAGE_ENTRY;
      setAiEnabled(enabled);

      // 加载AI默认消息配置
      const defaultMsg = (window as any).RUNTIME_CONFIG?.AI_DEFAULT_MESSAGE_NO_VIDEO;
      if (defaultMsg) {
        setAiDefaultMessageNoVideo(defaultMsg);
      }
    }
  }, []);

  // 检查源站寻片功能是否启用
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const enabled = (window as any).RUNTIME_CONFIG?.ENABLE_SOURCE_SEARCH !== false;
      setSourceSearchEnabled(enabled);
    }
  }, []);

  // 检查音乐功能是否启用
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const enabled = (window as any).RUNTIME_CONFIG?.TUNEHUB_ENABLED === true;
      setMusicEnabled(enabled);
    }
  }, []);

  // 检查公告弹窗状态
  useEffect(() => {
    if (typeof window !== 'undefined' && announcement) {
      const hasSeenAnnouncement = localStorage.getItem('hasSeenAnnouncement');
      if (hasSeenAnnouncement !== announcement) {
        setShowAnnouncement(true);
      } else {
        setShowAnnouncement(Boolean(!hasSeenAnnouncement && announcement));
      }
    }
  }, [announcement]);

  useEffect(() => {
    const CACHE_DURATION = 60 * 60 * 1000; // 1小时

    const getCache = (key: string) => {
      try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        const { data, timestamp } = JSON.parse(cached);
        return { data, expired: Date.now() - timestamp > CACHE_DURATION };
      } catch {
        return null;
      }
    };

    const setCache = (key: string, data: any) => {
      try {
        localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
      } catch {
        // Ignore localStorage errors
      }
    };

    const moviesCache = getCache('homepage_movies');
    const tvShowsCache = getCache('homepage_tvshows');
    const varietyCache = getCache('homepage_variety');
    const bangumiCache = getCache('homepage_bangumi');
    const duanjuCache = getCache('homepage_duanju');
    const upcomingCache = getCache('homepage_upcoming');
    const linkCache = getCache('homepage_link');

    if (moviesCache?.data) setHotMovies(moviesCache.data);
    if (tvShowsCache?.data) setHotTvShows(tvShowsCache.data);
    if (varietyCache?.data) setHotVarietyShows(varietyCache.data);
    if (bangumiCache?.data) setBangumiCalendarData(bangumiCache.data);
    if (duanjuCache?.data) setHotDuanju(duanjuCache.data);
    if (upcomingCache?.data) setUpcomingContent(upcomingCache.data);
    if (linkCache?.data) setlink(linkCache.data);

    const hasCache = moviesCache || tvShowsCache || varietyCache || bangumiCache || duanjuCache || upcomingCache|| linkCache;
    if (hasCache) setLoading(false);

    const needsRefresh = !moviesCache || moviesCache.expired || !tvShowsCache || tvShowsCache.expired ||
                         !varietyCache || varietyCache.expired || !bangumiCache || bangumiCache.expired ||
                         !duanjuCache || duanjuCache.expired || !upcomingCache || upcomingCache.expired|| !linkCache || linkCache.expired;

    if (needsRefresh) {
      (async () => {
        try {
          const [moviesData, tvShowsData, varietyShowsData, bangumiCalendarData] = await Promise.all([
            getDoubanCategories({ kind: 'movie', category: '热门', type: '全部' }),
            getDoubanCategories({ kind: 'tv', category: 'tv', type: 'tv' }),
            getDoubanCategories({ kind: 'tv', category: 'show', type: 'show' }),
            GetBangumiCalendarData(),
          ]);

          if (moviesData.code === 200) {
            setHotMovies(moviesData.list);
            setCache('homepage_movies', moviesData.list);
          }
          if (tvShowsData.code === 200) {
            setHotTvShows(tvShowsData.list);
            setCache('homepage_tvshows', tvShowsData.list);
          }
          if (varietyShowsData.code === 200) {
            setHotVarietyShows(varietyShowsData.list);
            setCache('homepage_variety', varietyShowsData.list);
          }
          setBangumiCalendarData(bangumiCalendarData);
          setCache('homepage_bangumi', bangumiCalendarData);

          try {
            const duanjuResponse = await fetch('/api/duanju/recommends');
            if (duanjuResponse.ok) {
              const duanjuResult = await duanjuResponse.json();
              if (duanjuResult.code === 200 && duanjuResult.data) {
                setHotDuanju(duanjuResult.data);
                setCache('homepage_duanju', duanjuResult.data);
              }
            }
          } catch (error) {
            console.error('获取热播短剧数据失败:', error);
          }

          try {
            const response = await fetch('/api/tmdb/upcoming');
            if (response.ok) {
              const result = await response.json();
              if (result.code === 200 && result.data) {
                const sorted = [...result.data].sort((a, b) => {
                  const dateA = new Date(a.release_date || '9999-12-31').getTime();
                  const dateB = new Date(b.release_date || '9999-12-31').getTime();
                  return dateA - dateB;
                });
                setUpcomingContent(sorted);
                setCache('homepage_upcoming', sorted);
              }
            }
          } catch (error) {
            console.error('获取TMDB即将上映数据失败:', error);
          }

          setLoading(false);
        } catch (error) {
          console.error('获取推荐数据失败:', error);
          setLoading(false);
        }
      })();
    }
  }, []);



  const handleCloseAnnouncement = (announcement: string) => {
    setShowAnnouncement(false);
    localStorage.setItem('hasSeenAnnouncement', announcement); // 记录已查看弹窗
  };

  // 渲染模块的函数
  const renderModule = (moduleId: string) => {
    switch (moduleId) {
      case 'hotMovies':
        return (
          <section key="hotMovies" className='mb-8'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200'>
                热门电影
              </h2>
              <Link
                href='/douban?type=movie'
                className='flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              >
                查看更多
                <ChevronRight className='w-4 h-4 ml-1' />
              </Link>
            </div>
            <ScrollableRow>
              {loading
                ? Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={index}
                      className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                    >
                      <div className='aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-2' />
                      <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4' />
                    </div>
                  ))
                : hotMovies.map((movie) => (
                    <div
                      key={movie.id}
                      className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                    >
                      <VideoCard
                        id={movie.id}
                        poster={movie.poster}
                        title={movie.title}
                        year={movie.year}
                        rate={movie.rate}
                        type='movie'
                        from='douban'
                      />
                    </div>
                  ))}
            </ScrollableRow>
          </section>
        );

      case 'hotDuanju':
        if (hotDuanju.length === 0) return null;
        return (
          <section key="hotDuanju" className='mb-8'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200'>
                热播短剧
              </h2>
            </div>
            <ScrollableRow>
              {loading
                ? Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={index}
                      className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                    >
                      <div className='aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-2' />
                      <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4' />
                    </div>
                  ))
                : hotDuanju.map((duanju) => (
                    <div
                      key={duanju.id + duanju.source}
                      className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                    >
                      <VideoCard
                        id={duanju.id}
                        source={duanju.source}
                        poster={duanju.poster}
                        title={duanju.title}
                        year={duanju.year}
                        type='tv'
                        from='search'
                        source_name={duanju.source_name}
                        episodes={duanju.episodes?.length}
                        douban_id={duanju.douban_id}
                        cmsData={{
                          desc: duanju.desc,
                          episodes: duanju.episodes,
                          episodes_titles: duanju.episodes_titles,
                        }}
                      />
                    </div>
                  ))}
            </ScrollableRow>
          </section>
        );

      case 'bangumiCalendar':
        return (
          <section key="bangumiCalendar" className='mb-8'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200'>
                新番放送
              </h2>
              <Link
                href='/douban?type=anime'
                className='flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              >
                查看更多
                <ChevronRight className='w-4 h-4 ml-1' />
              </Link>
            </div>
            <ScrollableRow>
              {loading
                ? Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={index}
                      className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                    >
                      <div className='relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-gray-200 animate-pulse dark:bg-gray-800'>
                        <div className='absolute inset-0 bg-gray-300 dark:bg-gray-700'></div>
                      </div>
                      <div className='mt-2 h-4 bg-gray-200 rounded animate-pulse dark:bg-gray-800'></div>
                    </div>
                  ))
                : (() => {
                    const today = new Date();
                    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const currentWeekday = weekdays[today.getDay()];
                    const todayAnimes =
                      bangumiCalendarData
                        .find((item) => item.weekday.en === currentWeekday)
                        ?.items.filter((anime) => anime.images) || [];

                    return todayAnimes.map((anime, index) => (
                      <div
                        key={`${anime.id}-${index}`}
                        className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                      >
                        <VideoCard
                          from='douban'
                          title={anime.name_cn || anime.name}
                          poster={
                            anime.images?.large ||
                            anime.images?.common ||
                            anime.images?.medium ||
                            anime.images?.small ||
                            anime.images?.grid ||
                            ''
                          }
                          douban_id={anime.id}
                          rate={anime.rating?.score?.toFixed(1) || ''}
                          year={anime.air_date?.split('-')?.[0] || ''}
                          isBangumi={true}
                        />
                      </div>
                    ));
                  })()}
            </ScrollableRow>
          </section>
        );

      case 'hotTvShows':
        return (
          <section key="hotTvShows" className='mb-8'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200'>
                热门剧集
              </h2>
              <Link
                href='/douban?type=tv'
                className='flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              >
                查看更多
                <ChevronRight className='w-4 h-4 ml-1' />
              </Link>
            </div>
            <ScrollableRow>
              {loading
                ? Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={index}
                      className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                    >
                      <div className='aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-2' />
                      <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4' />
                    </div>
                  ))
                : hotTvShows.map((tvShow) => (
                    <div
                      key={tvShow.id}
                      className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                    >
                      <VideoCard
                        id={tvShow.id}
                        poster={tvShow.poster}
                        title={tvShow.title}
                        year={tvShow.year}
                        rate={tvShow.rate}
                        type='tv'
                        from='douban'
                      />
                    </div>
                  ))}
            </ScrollableRow>
          </section>
        );

      case 'hotVarietyShows':
        return (
          <section key="hotVarietyShows" className='mb-8'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200'>
                热门综艺
              </h2>
              <Link
                href='/douban?type=tv&category=show'
                className='flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              >
                查看更多
                <ChevronRight className='w-4 h-4 ml-1' />
              </Link>
            </div>
            <ScrollableRow>
              {loading
                ? Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={index}
                      className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                    >
                      <div className='aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-2' />
                      <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4' />
                    </div>
                  ))
                : hotVarietyShows.map((varietyShow) => (
                    <div
                      key={varietyShow.id}
                      className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                    >
                      <VideoCard
                        id={varietyShow.id}
                        poster={varietyShow.poster}
                        title={varietyShow.title}
                        year={varietyShow.year}
                        rate={varietyShow.rate}
                        type='tv'
                        from='douban'
                      />
                    </div>
                  ))}
            </ScrollableRow>
          </section>
        );

      case 'upcomingContent':
        if (upcomingContent.length === 0) return null;
        return (
          <section key="upcomingContent" className='mb-8'>
            <div className='mb-4 flex items-center justify-between'>
              <h2 className='text-xl font-bold text-gray-800 dark:text-gray-200'>
                即将上映
              </h2>
            </div>
            <ScrollableRow>
              {upcomingContent.map((item) => (
                <div
                  key={`${item.media_type}-${item.id}`}
                  className='min-w-[96px] w-24 sm:min-w-[180px] sm:w-44'
                >
                  <VideoCard
                    title={item.title}
                    poster={processImageUrl(getTMDBImageUrl(item.poster_path))}
                    year={item.release_date?.split('-')?.[0] || ''}
                    rate={
                      item.vote_average && item.vote_average > 0
                        ? item.vote_average.toFixed(1)
                        : ''
                    }
                    type={item.media_type === 'tv' ? 'tv' : 'movie'}
                    from='douban'
                    releaseDate={item.release_date}
                    isUpcoming={true}
                  />
                </div>
              ))}
            </ScrollableRow>
          </section>
        );


        case 'link':
        <div className="mx-auto items-center space-y-4 text-center">
 <p>
    Powered by 💝💝💝
<a href="https://cloudflare.com/" rel="noopener noreferrer" target="_blank">赛博菩萨</a>；
  <a href="https://github.com/" rel="noopener noreferrer" target="_blank">小黄人</a>；
  <a href="https://www.cloudns.net/" rel="noopener noreferrer" target="_blank">CloudNS</a>；
  <a href="https://account.proton.me/mail" rel="noopener noreferrer" target="_blank">Proton Mail</a>；💝💝💝
</p>
</div>


<div className="mx-auto flex max-w-[64rem] flex-col items-center space-y-4 text-center">
   <p>
   🛠️🛠️🛠️网站联盟（自用）：
    <a href="https://imgbed.19781126.xyz/" rel="noopener noreferrer" target="_blank">图床</a>；
    <a href="https://paste.19781126.xyz/" rel="noopener noreferrer" target="_blank">网盘/WebDav</a>；
     <a href="https://panhub.19781126.xyz/" rel="noopener noreferrer" target="_blank">网盘搜索</a>；
    <a href="https://tv.19781126.xyz/" rel="noopener noreferrer" target="_blank">在线TV</a>；
    <a href="https://www.19781126.xyz/" rel="noopener noreferrer" target="_blank">博客</a>；
    <a href="https://media.19781126.xyz/" rel="noopener noreferrer" target="_blank">多媒体博客</a>；
    <a href="https://github.19781126.xyz/" rel="noopener noreferrer" target="_blank">GH加速</a>；
    <a href="https://comment.19781126.xyz/" rel="noopener noreferrer" target="_blank">评论</a>；
    <a href="https://mail.19781126.xyz/" rel="noopener noreferrer" target="_blank">邮箱</a>；
    <a href="https://epush.19781126.xyz/" rel="noopener noreferrer" target="_blank">消息推送</a>；🛠️🛠️🛠️
 </p>
 <hr />
</div>          



        
      default:
        return null;
    }
  };

  return (
    <PageLayout>
      <FireworksCanvas />
      {/* TMDB 热门轮播图 */}
      {homeBannerEnabled && (
        <div className='w-full mb-4'>
          <BannerCarousel delayLoad={true} />
        </div>
      )}

      <div className='px-2 sm:px-10 pb-4 sm:pb-8 overflow-visible'>
        <div className='max-w-[95%] mx-auto'>
          {/* 首页内容 */}
          <>
            {/* 源站寻片和AI问片入口 */}
            <div className={`flex items-center justify-end gap-2 mb-4 ${homeBannerEnabled ? '' : 'mt-[30px]'}`}>
              <button
                onClick={handleDirectPlay}
                className='p-1.5 rounded-lg text-blue-500 hover:text-blue-600 transition-colors'
                title='直链播放'
              >
                <LinkIcon size={18} />
              </button>

              {/* 音乐视听入口 */}
              {musicEnabled && (
                <Link href='/music'>
                  <button
                    className='p-2 rounded-lg text-green-500 hover:text-green-600 transition-colors'
                    title='音乐视听'
                  >
                    <Music size={20} />
                  </button>
                </Link>
              )}

              {/* 源站寻片入口 */}
              {sourceSearchEnabled && (
                <Link href='/source-search'>
                  <button
                    className='p-2 rounded-lg text-blue-500 hover:text-blue-600 transition-colors'
                    title='源站寻片'
                  >
                    <ListVideo size={20} />
                  </button>
                </Link>
              )}

              {/* AI问片入口 */}
              {aiEnabled && (
                <button
                  onClick={() => setShowAIChat(true)}
                  className='p-2 rounded-lg text-purple-500 hover:text-purple-600 transition-colors'
                  title='AI问片'
                >
                  <Bot size={20} />
                </button>
              )}
            </div>

            {/* 继续观看 */}
            {homeContinueWatchingEnabled && <ContinueWatching />}

            {/* 根据配置动态渲染首页模块 */}
            {homeModules
              .filter(module => module.enabled)
              .sort((a, b) => a.order - b.order)
              .map(module => renderModule(module.id))}
          </>
        </div>
      </div>

      {/* HTTP 环境警告弹窗 */}
      {showHttpWarning && (
        <HttpWarningDialog onClose={() => setShowHttpWarning(false)} />
      )}

      {/* AI问片面板 */}
      {aiEnabled && (
        <AIChatPanel
          isOpen={showAIChat}
          onClose={() => setShowAIChat(false)}
          welcomeMessage={aiDefaultMessageNoVideo}
        />
      )}

      {/* 公告弹窗 */}
      {showAnnouncement && (
        <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'>
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3'>
              公告
            </h3>
            <div className='text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap'>
              {announcement}
            </div>
            <button
              onClick={() => handleCloseAnnouncement(announcement || '')}
              className='w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'
            >
              知道了
            </button>
          </div>
        </div>
      )}

      {showDirectPlayDialog && (
        <div
          className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
          onClick={() => setShowDirectPlayDialog(false)}
        >
          <div
            className='bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg'
            onClick={(event) => event.stopPropagation()}
          >
            <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                直链播放
              </h3>
              <button
                onClick={() => setShowDirectPlayDialog(false)}
                className='p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors'
                aria-label='关闭'
              >
                <span className='text-gray-600 dark:text-gray-400'>×</span>
              </button>
            </div>
            <div className='p-4 space-y-4'>
              <div className='text-sm text-gray-600 dark:text-gray-300'>
                请输入可直接播放的视频链接。
              </div>
              <input
                value={directPlayUrl}
                onChange={(event) => setDirectPlayUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    submitDirectPlay();
                  }
                }}
                placeholder='https://example.com/video.m3u8'
                className='w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
              <div className='flex justify-end gap-2'>
                <button
                  onClick={() => setShowDirectPlayDialog(false)}
                  className='px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
                >
                  取消
                </button>
                <button
                  onClick={submitDirectPlay}
                  disabled={!directPlayUrl.trim()}
                  className='px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  开始播放
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeClient />
    </Suspense>
  );
}
