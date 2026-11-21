import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { ApiError, type CreatedOrder } from '@eg/api';
import { Confetti, Pop } from '@/anim';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { C } from '@/theme';
import { Button, ScreenHeader, T } from '@/ui';

type Phase = 'creating' | 'paying' | 'confirming' | 'paid' | 'failed' | 'cancelled' | 'unverified' | 'error';

/** Razorpay Standard Checkout page. It only reports back what happened; our server decides whether the payment is real. */
function checkoutHtml(o: CreatedOrder, name: string, email: string, desc: string) {
  const opts = { key: o.keyId, amount: o.amountPaise, currency: o.currency, name: 'ExamGadh', description: desc, order_id: o.razorpayOrderId, prefill: { name, email }, theme: { color: '#5a3df0' } };
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;background:#eef0f8;font-family:sans-serif}</style></head>
<body><script src="https://checkout.razorpay.com/v1/checkout.js"></script><script>
function post(m){window.ReactNativeWebView.postMessage(JSON.stringify(m));}
var failed=false;
var o=${JSON.stringify(opts).replace(/</g, '\\u003c')};
o.handler=function(r){post({type:'success',payload:r});};
o.modal={ondismiss:function(){post({type:failed?'failed':'dismiss'});},confirm_close:true};
window.onload=function(){try{var rz=new Razorpay(o);rz.on('payment.failed',function(){failed=true;});rz.open();}catch(e){post({type:'error'});}};
</script></body></html>`;
}

export default function Checkout() {
  const { planId, months } = useLocalSearchParams<{ planId: string; months: string }>();
  const { t } = useI18n();
  const { api, user, refreshUser } = useAuth();
  const qc = useQueryClient();
  const [phase, setPhase] = useState<Phase>('creating');
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const started = useRef(false);

  const begin = async () => {
    setPhase('creating');
    try {
      const o = await api.createOrder({ planId, months: Number(months) as 3 | 6 | 12 });
      setOrder(o);
      setPhase('paying');
    } catch (e) {
      setPhase(e instanceof ApiError && e.status >= 500 ? 'error' : 'error');
    }
  };
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void begin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const html = useMemo(() => (order ? checkoutHtml(order, user?.name ?? '', user?.email ?? '', `${planId} · ${months}`) : ''), [order, user, planId, months]);

  const onMessage = async (e: WebViewMessageEvent) => {
    let m: { type: string; payload?: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string } };
    try {
      m = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (m.type === 'dismiss') return setPhase('cancelled');
    if (m.type === 'failed') return setPhase('failed');
    if (m.type === 'error') return setPhase('error');
    if (m.type === 'success' && m.payload) {
      setPhase('confirming');
      try {
        await api.verifyPayment(m.payload);
        await Promise.all([qc.invalidateQueries(), refreshUser()]);
        setPhase('paid');
      } catch {
        // the webhook (or the next refresh) will still credit a real payment
        setPhase('unverified');
      }
    }
  };

  const result = (icon: 'ok' | 'no', title: string, body: string, retry?: boolean) => (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
      {icon === 'ok' ? <Confetti /> : null}
      <Pop>{icon === 'ok' ? <CheckCircle2 size={84} color={C.success} /> : <XCircle size={84} color={C.pink} />}</Pop>
      <T v="h1" center>{title}</T>
      <T v="body" center>{body}</T>
      <View style={{ alignSelf: 'stretch', gap: 10, marginTop: 12 }}>
        {retry ? <Button title={t('app.retry')} onPress={() => void begin()} /> : null}
        <Button title={t('app.close')} variant={retry ? 'soft' : 'primary'} onPress={() => router.replace('/plans')} />
      </View>
    </SafeAreaView>
  );

  if (Platform.OS === 'web') return result('no', t('plans.title'), 'Payments open only inside the phone app.');
  if (phase === 'paid') return result('ok', t('plans.pay.success'), '');
  if (phase === 'failed') return result('no', t('plans.pay.failed'), '', true);
  if (phase === 'cancelled') return result('no', t('plans.pay.cancelled'), '', true);
  if (phase === 'unverified') return result('no', t('plans.pay.verifyFailed'), '');
  if (phase === 'error') return result('no', t('plans.pay.notConfigured'), t('app.error'), true);
  if (phase === 'creating' || phase === 'confirming' || !order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <ActivityIndicator size="large" color={C.primary} />
        <T v="h3">{phase === 'confirming' ? t('plans.pay.processing') : t('app.loading')}</T>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScreenHeader title={t('plans.title')} />
      <WebView
        style={{ flex: 1, backgroundColor: C.bg }}
        source={{ html, baseUrl: 'https://checkout.razorpay.com' }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(e) => void onMessage(e)}
        setSupportMultipleWindows={false}
        // UPI apps (upi:, phonepe:, tez:, paytmmp: ...) are opened outside the WebView
        onShouldStartLoadWithRequest={(r) => {
          if (/^https?:|^about:|^data:|^blob:/i.test(r.url)) return true;
          void Linking.openURL(r.url).catch(() => undefined);
          return false;
        }}
      />
    </SafeAreaView>
  );
}
